class RetryChatInterface {
    constructor() {
        this.checkUserData();
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
        this.isRecording = false;
        this.isSpeaking = false;
        this.currentAudio = null; // 현재 재생 중인 오디오 추적
        this.synthesis = window.speechSynthesis;
        this.quests = [];
        this.completedQuests = new Set();
        this.messageAdded = false; // 메시지 추가 여부 추적
        
        // API URL 동적 설정
        this.apiBaseUrl = window.API_BASE_URL || 'http://localhost:5001';
        
        this.loadQuestsFromFeedback();
    }

    checkUserData() {
        const userData = localStorage.getItem('userData');
        if (!userData) {
            alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
            window.location.href = 'index.html';
            return;
        }
        
        try {
            const user = JSON.parse(userData);
            console.log('사용자 정보:', user);
        } catch (error) {
            console.error('사용자 데이터 파싱 오류:', error);
            window.location.href = 'index.html';
        }
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.textInput = document.getElementById('textInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.stopVoiceBtn = document.getElementById('stopVoiceBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.clearBtn = document.getElementById('clearBtn');
        this.viewLogsBtn = document.getElementById('viewLogsBtn');
        this.questList = document.getElementById('questList');
        this.progressFill = document.getElementById('progressFill');
        this.completedCount = document.getElementById('completedCount');
        this.totalCount = document.getElementById('totalCount');
    }

    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('이 브라우저는 음성 인식을 지원하지 않습니다.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'ko-KR';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.voiceBtn.classList.add('recording');
            this.voiceBtn.querySelector('.mic-text').textContent = '음성 인식 중...';
            this.voiceStatus.textContent = '듣고 있습니다...';
            this.stopCurrentAudio(); // 음성 인식 시작 시 현재 재생 중인 오디오 중단
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.textInput.value = transcript;
            this.voiceStatus.textContent = `인식된 텍스트: "${transcript}"`;
        };

        this.recognition.onerror = (event) => {
            console.error('음성 인식 오류:', event.error);
            this.voiceStatus.textContent = `오류: ${event.error}`;
            this.stopRecording();
        };

        this.recognition.onend = () => {
            this.stopRecording();
        };
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        this.stopVoiceBtn.addEventListener('click', () => this.stopAllAudio());
        this.clearBtn.addEventListener('click', () => this.clearConversation());
        this.viewLogsBtn.addEventListener('click', () => this.viewLogs());
    }

    toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        if (this.recognition) {
            this.recognition.start();
        }
    }

    stopCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // 브라우저 내장 TTS도 중단
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
    }

    // 모든 음성 중단 (사용자가 버튼을 눌렀을 때)
    stopAllAudio() {
        // 현재 오디오 중단 (이벤트 리스너 제거 후 중단)
        if (this.currentAudio) {
            this.currentAudio.onended = null; // 이벤트 리스너 제거
            this.currentAudio.onerror = null;
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // 브라우저 내장 TTS도 중단
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        
        // 음성 인식도 중단
        if (this.isRecording && this.recognition) {
            this.isRecording = false; // 먼저 상태를 false로 설정
            this.recognition.stop();
        }
        
        // 상태 메시지 업데이트
        this.voiceStatus.textContent = '음성이 중단되었습니다.';
        
        // 버튼 상태 업데이트
        this.voiceBtn.classList.remove('recording');
        this.voiceBtn.querySelector('.mic-text').textContent = '음성';
        
        // 음성 멈춤 버튼 비활성화
        this.stopVoiceBtn.disabled = true;
        
        // 3초 후 음성 멈춤 버튼 다시 활성화
        setTimeout(() => {
            this.stopVoiceBtn.disabled = false;
            this.voiceStatus.textContent = '';
        }, 3000);
    }

    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isRecording = false;
        this.voiceBtn.classList.remove('recording');
        this.voiceBtn.querySelector('.mic-text').textContent = '음성';
        this.voiceStatus.textContent = '';
    }

    sendMessage() {
        const message = this.textInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.textInput.value = '';
        this.generateBotResponse(message);
    }

    addMessage(content, sender, speak = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        this.optimizeChatArea();

        if (sender === 'bot' && speak && !this.messageAdded) {
            this.messageAdded = true;
            // 음성 재생을 더 오래 지연시켜서 채팅 표시를 우선시
            setTimeout(() => {
                this.speakMessage(content);
            }, 500); // 500ms 지연으로 음성이 충분히 준비된 후 시작되도록
        }
    }

    async generateBotResponse(userMessage) {
        try {
            this.addMessage('생각 중입니다...', 'bot', false);
            
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    participant_id: participantId,
                    page_type: 'retry'  // retry.html 페이지 타입
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                // 로딩 메시지를 실제 응답으로 교체
                this.replaceLoadingMessage(data.response);
                // 퀘스트 완료 여부를 비동기로 체크
                this.checkQuestCompletion(userMessage, data.response);
            } else {
                // 로딩 메시지 제거
                const loadingMessage = this.chatMessages.lastElementChild;
                if (loadingMessage && loadingMessage.querySelector('.message-content').textContent === '생각 중입니다...') {
                    loadingMessage.remove();
                }
                this.addMessage('죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다.', 'bot');
            }
            
        } catch (error) {
            console.error('LLM API 오류:', error);
            
            const loadingMessage = this.chatMessages.lastElementChild;
            if (loadingMessage && loadingMessage.querySelector('.message-content').textContent === '생각 중입니다...') {
                loadingMessage.remove();
            }
            
            this.addMessage('네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.', 'bot');
        }
    }

    // 로딩 메시지를 실제 응답으로 교체
    replaceLoadingMessage(response) {
        const loadingMessage = this.chatMessages.lastElementChild;
        if (loadingMessage && loadingMessage.querySelector('.message-content').textContent === '생각 중입니다...') {
            // 로딩 메시지 제거
            loadingMessage.remove();
        }
        
        // 실제 응답 메시지 추가
        this.addMessage(response, 'bot');
    }

    async speakMessage(text) {
        // 기존 오디오 중단
        this.stopCurrentAudio();
        
        // 메시지 추가 플래그 초기화
        this.messageAdded = false;
        
        try {
            // 사용자 ID 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            const response = await fetch(`${this.apiBaseUrl}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text,
                    participant_id: participantId
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const audio = new Audio(`${this.apiBaseUrl}${data.audio_url}`);
                this.currentAudio = audio; // 현재 오디오 추적
                
                audio.onended = () => {
                    this.currentAudio = null;
                };
                
                audio.onerror = () => {
                    this.currentAudio = null;
                    this.fallbackTTS(text);
                };
                
                audio.play();
            } else {
                this.fallbackTTS(text);
            }
        } catch (error) {
            console.error('TTS 오류:', error);
            this.fallbackTTS(text);
        }
    }

    fallbackTTS(text) {
        // 기존 TTS 중단
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        
        if (this.synthesis) {
            this.isSpeaking = true;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            utterance.rate = 0.9;
            utterance.pitch = 0.8;
            
            utterance.onend = () => {
                this.isSpeaking = false;
            };
            
            utterance.onerror = () => {
                this.isSpeaking = false;
            };
            
            this.synthesis.speak(utterance);
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // 채팅 영역 최적화
    optimizeChatArea() {
        // 채팅 메시지가 많아지면 자동으로 스크롤
        const messages = this.chatMessages.querySelectorAll('.message');
        if (messages.length > 10) {
            this.scrollToBottom();
        }
        
        // 입력 섹션이 항상 하단에 고정되도록 보장
        const inputSection = document.querySelector('.input-section');
        if (inputSection) {
            inputSection.style.flexShrink = '0';
            inputSection.style.marginTop = 'auto';
        }
        
        // 채팅 섹션이 전체 높이를 사용하도록 보장
        const chatSection = document.querySelector('.chat-section');
        if (chatSection) {
            chatSection.style.height = '100%';
            chatSection.style.display = 'flex';
            chatSection.style.flexDirection = 'column';
        }
        
        // 채팅 메시지 영역을 최대한 크게 만들기
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.style.flex = '1';
            chatMessages.style.minHeight = '600px';
        }
    }

    async clearConversation() {
        const confirmed = confirm('정말로 진료 세션을 초기화하시겠습니까?\n\n모든 대화 내용이 삭제됩니다.');
        
        if (!confirmed) {
            return;
        }
        
        try {
            await fetch(`${this.apiBaseUrl}/api/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const messages = this.chatMessages.querySelectorAll('.message');
            for (let i = 1; i < messages.length; i++) {
                messages[i].remove();
            }

            this.addMessage('진료 세션이 초기화되었습니다.', 'bot');
            
        } catch (error) {
            console.error('대화 초기화 오류:', error);
            this.addMessage('진료 세션 초기화 중 오류가 발생했습니다.', 'bot');
        }
    }

    async viewLogs() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            const response = await fetch(`${this.apiBaseUrl}/api/logs?participant_id=${participantId || ''}&page_type=chat`);
            const data = await response.json();
            
            if (data.status === 'success') {
                this.showLogsModal(data.logs, data.date, data.participant_id);
            } else {
                this.showError('로그 조회 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('로그 조회 오류:', error);
            this.showError('로그 조회 중 네트워크 오류가 발생했습니다.');
        }
    }

    showLogsModal(logs, date, participantId) {
        const modal = document.createElement('div');
        modal.className = 'logs-modal';
        
        const formatTime = (timestamp) => {
            const date = new Date(timestamp);
            return date.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const formatMessage = (message) => {
            // 긴 메시지는 줄바꿈 처리
            if (message.length > 100) {
                return message.replace(/(.{100})/g, '$1\n');
            }
            return message;
        };

        modal.innerHTML = `
            <div class="logs-modal-content">
                <div class="logs-modal-header">
                    <div class="header-content">
                        <h3>📋 이전 진료 대화 기록</h3>
                        <div class="header-info">
                            <span class="date-info">📅 ${date}</span>
                            ${participantId ? `<span class="participant-info">👤 ${participantId}</span>` : ''}
                            <span class="page-info">🏥 진료 연습</span>
                        </div>
                    </div>
                    <button class="close-btn" title="닫기">×</button>
                </div>
                <div class="logs-modal-body">
                    ${logs.length > 0 ? `
                        <div class="logs-summary">
                            <div class="summary-item">
                                <span class="summary-icon">💬</span>
                                <span class="summary-text">총 ${logs.length}개의 대화</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-icon">⏱️</span>
                                <span class="summary-text">${formatTime(logs[0]?.timestamp)} ~ ${formatTime(logs[logs.length-1]?.timestamp)}</span>
                            </div>
                        </div>
                        <div class="logs-container">
                            ${logs.map((log, index) => `
                                <div class="log-entry" style="animation-delay: ${index * 0.1}s;">
                                    <div class="log-header">
                                        <div class="log-timestamp">🕐 ${formatTime(log.timestamp)}</div>
                                        <div class="log-number">#${index + 1}</div>
                                    </div>
                                    <div class="log-messages">
                                        <div class="log-user">
                                            <div class="message-label">👤 환자</div>
                                            <div class="message-content">${formatMessage(log.user_message)}</div>
                                        </div>
                                        <div class="log-doctor">
                                            <div class="message-label">👨‍⚕️ 의사</div>
                                            <div class="message-content">${formatMessage(log.bot_response)}</div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-logs">
                            <div class="empty-icon">📭</div>
                            <h4>대화 기록이 없습니다</h4>
                            <p>아직 저장된 대화 기록이 없습니다.<br>진료 대화를 시작해보세요!</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                }, 300);
            }
        });

        // ESC 키로 닫기
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                }, 300);
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
    }

    showError(message) {
        alert(message);
    }

    // 피드백에서 퀘스트 로드
    async loadQuestsFromFeedback() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            if (!participantId) {
                console.error('참여자 ID가 없습니다.');
                this.loadDefaultQuests();
                return;
            }

            // 피드백 데이터 가져오기
            const response = await fetch(`${this.apiBaseUrl}/api/feedback?participant_id=${participantId}`);
            const data = await response.json();
            
            if (data.status === 'success' && data.feedback_data.length > 0) {
                // 가장 최근 피드백 데이터 사용
                const latestFeedback = data.feedback_data[data.feedback_data.length - 1];
                this.createQuestsFromFeedback(latestFeedback);
            } else {
                console.log('피드백 데이터가 없습니다. 기본 퀘스트를 로드합니다.');
                this.loadDefaultQuests();
            }
        } catch (error) {
            console.error('피드백 로드 오류:', error);
            this.loadDefaultQuests();
        }
    }

    createQuestsFromFeedback(feedbackData) {
        this.quests = [];
        
        try {
            const evaluation = feedbackData.evaluation_result;
            const grades = evaluation.grades || {};
            const scoreReasons = evaluation.score_reasons || {};
            
            // '하' 등급의 항목들만 퀘스트로 변환 (개선이 가장 필요한 항목들)
            Object.keys(grades).forEach(category => {
                const grade = grades[category];
                if (grade === '하') {
                    const reason = scoreReasons[category] || '개선이 필요한 항목입니다.';
                    
                    const quest = {
                        id: category,
                        title: this.getCategoryTitle(category),
                        description: reason,
                        grade: grade,
                        icon: this.getCategoryIcon(category),
                        keywords: this.getCategoryKeywords(category)
                    };
                    
                    this.quests.push(quest);
                }
            });
            
            // '하' 등급이 없으면 '중' 등급도 포함
            if (this.quests.length === 0) {
                Object.keys(grades).forEach(category => {
                    const grade = grades[category];
                    if (grade === '중') {
                        const reason = scoreReasons[category] || '개선이 필요한 항목입니다.';
                        
                        const quest = {
                            id: category,
                            title: this.getCategoryTitle(category),
                            description: reason,
                            grade: grade,
                            icon: this.getCategoryIcon(category),
                            keywords: this.getCategoryKeywords(category)
                        };
                        
                        this.quests.push(quest);
                    }
                });
            }
            
            if (this.quests.length === 0) {
                this.loadDefaultQuests();
            } else {
                this.renderQuests();
                this.updateProgress();
            }
        } catch (error) {
            console.error('피드백에서 퀘스트 생성 오류:', error);
            this.loadDefaultQuests();
        }
    }

    getCategoryTitle(category) {
        const titles = {
            'symptom_description': '증상을 구체적으로 설명하기',
            'medical_history': '과거 병력과 알레르기 말하기',
            'medication_info': '복용 중인 약물 언급하기',
            'symptom_location': '증상의 정확한 위치 말하기',
            'symptom_timing': '증상의 시작 시기와 지속 시간 말하기',
            'communication_clarity': '명확하고 이해하기 쉽게 설명하기',
            'question_asking': '의사에게 적절한 질문하기',
            'follow_up': '의사의 설명에 대한 확인과 추가 질문하기',
            'allergy_info': '알레르기 정보 제공하기',
            'family_history': '가족 병력 언급하기',
            'lifestyle_info': '생활 습관과 환경 정보 말하기',
            'current_condition': '현재 상태와 증상 변화 설명하기',
            'pain_description': '통증의 성격과 강도 설명하기',
            'symptom_progression': '증상의 진행 과정 설명하기',
            'treatment_history': '이전 치료 경험 말하기',
            'medication_side_effects': '약물 부작용 경험 말하기',
            'emergency_symptoms': '응급 증상 여부 확인하기',
            'daily_impact': '일상생활에 미치는 영향 설명하기',
            'stress_factors': '스트레스나 유발 요인 언급하기',
            'emergency_plan': '응급 상황 대처 계획 수립하기',
            'prevention_strategy': '예방 전략과 주의사항 확인하기',
            'recovery_expectation': '회복 과정과 예상 경과 이해하기',
            'lifestyle_modification': '생활 습관 개선 방안 확인하기',
            'medication_adherence': '약물 복용 준수 방법 확인하기',
            'follow_up_appointment': '후속 진료 일정 확인하기',
            'self_monitoring': '자가 관찰 방법 배우기',
            'warning_signs': '주의해야 할 증상 인지하기',
            'dietary_restrictions': '식이 제한사항 확인하기',
            'activity_restrictions': '활동 제한사항 확인하기',
            'work_restrictions': '업무 제한사항 확인하기',
            'emotional_support': '정서적 지원 방법 확인하기',
            'caregiver_guidance': '보호자 지도사항 확인하기',
            'community_resources': '지역사회 자원 활용하기',
            'insurance_coverage': '보험 적용 범위 확인하기',
            'cost_considerations': '치료 비용 고려사항 확인하기',
            'alternative_treatments': '대안 치료 방법 확인하기',
            'clinical_trials': '임상시험 참여 가능성 확인하기',
            'second_opinion': '다른 의사 의견 청취하기',
            'specialist_referral': '전문의 진료 의뢰하기',
            'diagnostic_testing': '진단 검사 과정 이해하기',
            'treatment_options': '치료 옵션 비교하기',
            'risk_assessment': '위험도 평가 이해하기',
            'prognosis_discussion': '예후에 대한 논의하기',
            'palliative_care': '완화 치료 옵션 확인하기',
            'rehabilitation_plan': '재활 계획 수립하기',
            'home_care_instructions': '가정 간호 지침 확인하기',
            'equipment_needs': '필요한 장비 확인하기',
            'transportation_arrangements': '이동 수단 준비하기',
            'financial_assistance': '경제적 지원 방법 확인하기',
            'legal_considerations': '법적 고려사항 확인하기',
            'advance_directives': '사전 의료지시서 작성하기',
            'end_of_life_care': '임종기 돌봄 계획 수립하기'
        };
        return titles[category] || `${category} 개선하기`;
    }

    getCategoryIcon(category) {
        const icons = {
            'symptom_description': '📋',
            'medical_history': '🏥',
            'medication_info': '💊',
            'symptom_location': '📍',
            'symptom_timing': '⏰',
            'communication_clarity': '💬',
            'question_asking': '❓',
            'follow_up': '🔄',
            'allergy_info': '🤧',
            'family_history': '👨‍👩‍👧‍👦',
            'lifestyle_info': '🏃‍♂️',
            'current_condition': '📊',
            'pain_description': '😣',
            'symptom_progression': '📈',
            'treatment_history': '🩺',
            'medication_side_effects': '⚠️',
            'emergency_symptoms': '🚨',
            'daily_impact': '📅',
            'stress_factors': '😰',
            'emergency_plan': '🚑',
            'prevention_strategy': '🛡️',
            'recovery_expectation': '📈',
            'lifestyle_modification': '🏃‍♂️',
            'medication_adherence': '✅',
            'follow_up_appointment': '📅',
            'self_monitoring': '👁️',
            'warning_signs': '⚠️',
            'dietary_restrictions': '🍽️',
            'activity_restrictions': '🚫',
            'work_restrictions': '💼',
            'emotional_support': '💝',
            'caregiver_guidance': '👥',
            'community_resources': '🏘️',
            'insurance_coverage': '📋',
            'cost_considerations': '💰',
            'alternative_treatments': '🌿',
            'clinical_trials': '🔬',
            'second_opinion': '👨‍⚕️',
            'specialist_referral': '🏥',
            'diagnostic_testing': '🔬',
            'treatment_options': '⚖️',
            'risk_assessment': '📊',
            'prognosis_discussion': '📋',
            'palliative_care': '🕊️',
            'rehabilitation_plan': '🔄',
            'home_care_instructions': '🏠',
            'equipment_needs': '🛠️',
            'transportation_arrangements': '🚗',
            'financial_assistance': '💳',
            'legal_considerations': '⚖️',
            'advance_directives': '📄',
            'end_of_life_care': '🕯️'
        };
        return icons[category] || '📝';
    }

    getCategoryKeywords(category) {
        const keywords = {
            'symptom_description': ['증상', '어디가', '어떻게', '얼마나', '구체적'],
            'medical_history': ['과거', '알레르기', '병력', '만성', '수술'],
            'medication_info': ['약', '복용', '처방', '투약', '현재'],
            'symptom_location': ['머리', '배', '가슴', '목', '팔', '다리', '위치'],
            'symptom_timing': ['언제', '시작', '부터', '지속', '시간', '기간'],
            'communication_clarity': ['명확', '이해', '설명', '자세히'],
            'question_asking': ['질문', '궁금', '알고', '확인'],
            'follow_up': ['추가', '더', '그리고', '또한', '확인'],
            'allergy_info': ['알레르기', '알레르기', '반응', '부작용', '민감'],
            'family_history': ['가족', '부모', '형제', '유전', '병력'],
            'lifestyle_info': ['생활', '습관', '운동', '식사', '수면', '직업'],
            'current_condition': ['현재', '상태', '변화', '악화', '개선'],
            'pain_description': ['통증', '아픔', '찌르는', '쑤시는', '강도'],
            'symptom_progression': ['진행', '악화', '개선', '변화', '과정'],
            'treatment_history': ['치료', '병원', '의사', '처방', '이전'],
            'medication_side_effects': ['부작용', '부정', '반응', '부담', '불편'],
            'emergency_symptoms': ['응급', '위험', '심각', '급성', '즉시'],
            'daily_impact': ['일상', '생활', '영향', '불편', '제한'],
            'stress_factors': ['스트레스', '유발', '원인', '요인', '상황'],
            'emergency_plan': ['응급', '대처', '계획', '위험', '상황'],
            'prevention_strategy': ['예방', '전략', '주의', '방지', '안전'],
            'recovery_expectation': ['회복', '예상', '경과', '과정', '기간'],
            'lifestyle_modification': ['생활', '습관', '개선', '변경', '조정'],
            'medication_adherence': ['약물', '복용', '준수', '규칙', '시간'],
            'follow_up_appointment': ['후속', '진료', '일정', '예약', '방문'],
            'self_monitoring': ['자가', '관찰', '체크', '모니터링', '기록'],
            'warning_signs': ['주의', '증상', '경고', '징후', '위험'],
            'dietary_restrictions': ['식이', '제한', '음식', '금기', '섭취'],
            'activity_restrictions': ['활동', '제한', '운동', '금기', '행동'],
            'work_restrictions': ['업무', '제한', '직장', '일', '근무'],
            'emotional_support': ['정서', '지원', '감정', '돌봄', '심리'],
            'caregiver_guidance': ['보호자', '지도', '돌봄', '가족', '관리'],
            'community_resources': ['지역', '자원', '사회', '지원', '서비스'],
            'insurance_coverage': ['보험', '적용', '범위', '보장', '혜택'],
            'cost_considerations': ['비용', '고려', '경제', '돈', '지출'],
            'alternative_treatments': ['대안', '치료', '방법', '대체', '선택'],
            'clinical_trials': ['임상', '시험', '연구', '실험', '참여'],
            'second_opinion': ['다른', '의사', '의견', '청취', '상담'],
            'specialist_referral': ['전문의', '진료', '의뢰', '전문', '상담'],
            'diagnostic_testing': ['진단', '검사', '과정', '이해', '절차'],
            'treatment_options': ['치료', '옵션', '선택', '방법', '비교'],
            'risk_assessment': ['위험', '평가', '도', '분석', '확률'],
            'prognosis_discussion': ['예후', '논의', '전망', '예상', '결과'],
            'palliative_care': ['완화', '치료', '돌봄', '안락', '관리'],
            'rehabilitation_plan': ['재활', '계획', '복원', '회복', '훈련'],
            'home_care_instructions': ['가정', '간호', '지침', '돌봄', '관리'],
            'equipment_needs': ['장비', '필요', '도구', '기구', '설비'],
            'transportation_arrangements': ['이동', '수단', '교통', '준비', '편의'],
            'financial_assistance': ['경제', '지원', '도움', '비용', '지원'],
            'legal_considerations': ['법적', '고려', '사항', '법률', '권리'],
            'advance_directives': ['사전', '의료', '지시', '서', '서면'],
            'end_of_life_care': ['임종', '돌봄', '계획', '말기', '관리']
        };
        return keywords[category] || ['개선', '향상'];
    }



    loadDefaultQuests() {
        // 기본 퀘스트 (피드백 데이터가 없을 때)
        this.quests = [
            {
                id: 'symptom',
                title: '증상을 구체적으로 설명하기',
                description: '어디가, 언제부터, 얼마나 심한지 구체적으로 말해보세요.',
                icon: '📋',
                keywords: ['위치', '시작', '강도', '지속']
            },
            {
                id: 'medication',
                title: '복용 중인 약물 언급하기',
                description: '현재 먹고 있는 약이 있다면 반드시 언급해주세요.',
                icon: '💊',
                keywords: ['약', '복용', '처방', '투약']
            },
            {
                id: 'history',
                title: '과거 병력과 알레르기 말하기',
                description: '과거 병력이나 알레르기가 있다면 미리 준비해두세요.',
                icon: '🏥',
                keywords: ['과거', '알레르기', '병력', '만성']
            }
        ];

        this.renderQuests();
        this.updateProgress();
    }

    renderQuests() {
        this.questList.innerHTML = '';
        
        this.quests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = `quest-item ${this.completedQuests.has(quest.id) ? 'completed' : ''}`;
            
            const gradeBadge = quest.grade ? `<span class="grade-badge ${quest.grade}">${quest.grade}</span>` : '';
            
            questElement.innerHTML = `
                <div class="quest-header">
                    <div class="quest-content">
                        <span class="quest-icon">${quest.icon}</span>
                        <div class="quest-description">${quest.description}</div>
                        ${gradeBadge}
                    </div>
                    <div class="quest-checkbox">
                        <input type="checkbox" id="quest-${quest.id}" ${this.completedQuests.has(quest.id) ? 'checked' : ''}>
                        <label for="quest-${quest.id}"></label>
                    </div>
                </div>
            `;
            
            const checkbox = questElement.querySelector(`#quest-${quest.id}`);
            checkbox.addEventListener('change', () => {
                this.toggleQuestCompletion(quest.id);
            });
            

            
            this.questList.appendChild(questElement);
        });
    }

    toggleQuestCompletion(questId) {
        if (this.completedQuests.has(questId)) {
            this.completedQuests.delete(questId);
        } else {
            this.completedQuests.add(questId);
        }
        
        this.renderQuests();
        this.updateProgress();
    }

    updateProgress() {
        const total = this.quests.length;
        const completed = this.completedQuests.size;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        
        this.progressFill.style.width = `${percentage}%`;
        this.completedCount.textContent = completed;
        this.totalCount.textContent = total;
    }

    async checkQuestCompletion(userMessage, botResponse) {
        try {
            // 사용자 정보 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            // 현재 진행 중인 퀘스트들
            const activeQuests = this.quests.filter(quest => !this.completedQuests.has(quest.id));
            
            if (activeQuests.length === 0) {
                return; // 모든 퀘스트가 완료된 경우
            }
            
            // LLM에게 퀘스트 완료 여부 분석 요청
            const response = await fetch(`${this.apiBaseUrl}/api/analyze-quest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_message: userMessage,
                    bot_response: botResponse,
                    active_quests: activeQuests.map(quest => ({
                        id: quest.id,
                        title: quest.title,
                        description: quest.description,
                        keywords: quest.keywords
                    })),
                    participant_id: participantId
                })
            });

            const data = await response.json();
            
            if (data.status === 'success' && data.completed_quests) {
                // 완료된 퀘스트들 처리
                data.completed_quests.forEach(questId => {
                    if (!this.completedQuests.has(questId)) {
                        this.completedQuests.add(questId);
                        const quest = this.quests.find(q => q.id === questId);
                        if (quest) {
                            this.showQuestCompletion(quest);
                        }
                    }
                });
                
                this.renderQuests();
                this.updateProgress();
            }
            
        } catch (error) {
            console.error('퀘스트 분석 오류:', error);
            // 오류 발생 시 기존 키워드 기반 방식으로 폴백
            this.fallbackQuestCheck(userMessage, botResponse);
        }
    }

    fallbackQuestCheck(userMessage, botResponse) {
        const conversationText = `${userMessage} ${botResponse}`.toLowerCase();
        
        this.quests.forEach(quest => {
            if (!this.completedQuests.has(quest.id)) {
                const hasKeywords = quest.keywords.some(keyword => 
                    conversationText.includes(keyword.toLowerCase())
                );
                
                if (hasKeywords) {
                    this.completedQuests.add(quest.id);
                    this.showQuestCompletion(quest);
                }
            }
        });
        
        this.renderQuests();
        this.updateProgress();
    }

    showQuestCompletion(quest) {
        // 퀘스트 완료 알림
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
            z-index: 1000;
            animation: slideIn 0.5s ease;
            max-width: 350px;
            border-left: 5px solid #20c997;
        `;
        
        const gradeText = quest.grade ? ` (${quest.grade} 등급 개선)` : '';
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.5rem;">${quest.icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 3px;">퀘스트 완료! 🎉</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">${quest.title}${gradeText}</div>
                </div>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 0.85rem; opacity: 0.9;">
                <div style="margin-bottom: 5px;">✅ AI가 자동으로 분석하여 완료를 확인했습니다!</div>
                <div>이제 더 나은 진료 대화를 할 수 있습니다.</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const chatInterface = new RetryChatInterface();
    
    // 초기 채팅 영역 최적화
    chatInterface.optimizeChatArea();
    
    // 추가 최적화를 위한 지연 실행
    setTimeout(() => {
        chatInterface.optimizeChatArea();
    }, 500);
}); 