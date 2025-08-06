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

        if (sender === 'bot' && speak) {
            this.speakMessage(content);
        }
    }

    async generateBotResponse(userMessage) {
        try {
            this.addMessage('생각 중입니다...', 'bot', false);
            
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    participant_id: participantId
                })
            });

            const data = await response.json();
            
            const loadingMessage = this.chatMessages.lastElementChild;
            if (loadingMessage && loadingMessage.querySelector('.message-content').textContent === '생각 중입니다...') {
                loadingMessage.remove();
            }

            if (data.status === 'success') {
                this.addMessage(data.response, 'bot');
                // 퀘스트 완료 여부를 비동기로 체크
                this.checkQuestCompletion(userMessage, data.response);
            } else {
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

    async speakMessage(text) {
        // 기존 오디오 중단
        this.stopCurrentAudio();
        
        try {
            const response = await fetch('http://localhost:5000/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const audio = new Audio(`http://localhost:5000${data.audio_url}`);
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
            await fetch('http://localhost:5000/api/clear', {
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
            
            const response = await fetch(`http://localhost:5000/api/logs?participant_id=${participantId || ''}`);
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
        modal.innerHTML = `
            <div class="logs-modal-content">
                <div class="logs-modal-header">
                    <h3>이전 대화 기록 (${date})${participantId ? ` - ${participantId}` : ''}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="logs-modal-body">
                    ${logs.length > 0 ? logs.map(log => `
                        <div class="log-entry">
                            <div class="log-timestamp">${new Date(log.timestamp).toLocaleString('ko-KR')}</div>
                            <div class="log-user"><strong>환자:</strong> ${log.user_message}</div>
                            <div class="log-doctor"><strong>의사:</strong> ${log.bot_response}</div>
                        </div>
                    `).join('') : '<p>해당 참여자의 로그가 없습니다.</p>'}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
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
            const response = await fetch(`http://localhost:5000/api/feedback?participant_id=${participantId}`);
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
                        keywords: this.getCategoryKeywords(category),
                        improvement_tips: this.getImprovementTips(category)
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
                            keywords: this.getCategoryKeywords(category),
                            improvement_tips: this.getImprovementTips(category)
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
            'follow_up': '의사의 설명에 대한 확인과 추가 질문하기'
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
            'follow_up': '🔄'
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
            'follow_up': ['추가', '더', '그리고', '또한', '확인']
        };
        return keywords[category] || ['개선', '향상'];
    }

    getImprovementTips(category) {
        const tips = {
            'symptom_description': [
                '증상의 구체적인 위치를 말하세요 (예: "오른쪽 복부 아래쪽")',
                '증상의 강도를 설명하세요 (예: "찌르는 듯한 통증")',
                '증상이 언제부터 시작되었는지 말하세요',
                '증상이 지속되는 시간을 구체적으로 말하세요'
            ],
            'medical_history': [
                '과거에 비슷한 증상이 있었는지 말하세요',
                '알레르기가 있는지 확인하고 언급하세요',
                '만성 질환이 있다면 반드시 말하세요',
                '최근 수술이나 입원 경험이 있다면 언급하세요'
            ],
            'medication_info': [
                '현재 복용 중인 모든 약물을 언급하세요',
                '처방약과 일반약 모두 포함해서 말하세요',
                '약물 복용 기간을 구체적으로 말하세요',
                '약물에 대한 부작용이 있었는지 말하세요'
            ],
            'symptom_location': [
                '증상이 나타나는 정확한 부위를 말하세요',
                '통증이 퍼지는지, 어디로 퍼지는지 설명하세요',
                '압박했을 때 통증이 심해지는지 말하세요',
                '특정 자세나 움직임에 따라 증상이 변하는지 설명하세요'
            ],
            'symptom_timing': [
                '증상이 언제부터 시작되었는지 구체적으로 말하세요',
                '증상이 지속되는 시간을 말하세요',
                '증상이 하루 중 언제 심해지는지 설명하세요',
                '증상이 점진적으로 심해졌는지, 갑자기 시작되었는지 말하세요'
            ],
            'communication_clarity': [
                '의학 용어보다는 일상적인 표현을 사용하세요',
                '증상을 구체적이고 명확하게 설명하세요',
                '의사의 질문에 정확하게 답변하세요',
                '이해가 안 되는 부분은 다시 질문하세요'
            ],
            'question_asking': [
                '진단에 대해 구체적으로 질문하세요',
                '치료 방법에 대해 자세히 물어보세요',
                '약물의 부작용에 대해 확인하세요',
                '생활에서 주의할 점을 물어보세요'
            ],
            'follow_up': [
                '의사의 설명을 듣고 이해한 내용을 확인하세요',
                '추가로 궁금한 점이 있으면 물어보세요',
                '치료 후 예상되는 경과를 물어보세요',
                '재검사나 후속 조치가 필요한지 확인하세요'
            ]
        };
        return tips[category] || ['개선을 위해 노력해보세요.'];
    }

    loadDefaultQuests() {
        // 기본 퀘스트 (피드백 데이터가 없을 때)
        this.quests = [
            {
                id: 'symptom',
                title: '증상을 구체적으로 설명하기',
                description: '어디가, 언제부터, 얼마나 심한지 구체적으로 말해보세요.',
                icon: '📋',
                keywords: ['위치', '시작', '강도', '지속'],
                improvement_tips: [
                    '증상의 구체적인 위치를 말하세요 (예: "오른쪽 복부 아래쪽")',
                    '증상의 강도를 설명하세요 (예: "찌르는 듯한 통증")',
                    '증상이 언제부터 시작되었는지 말하세요',
                    '증상이 지속되는 시간을 구체적으로 말하세요'
                ]
            },
            {
                id: 'medication',
                title: '복용 중인 약물 언급하기',
                description: '현재 먹고 있는 약이 있다면 반드시 언급해주세요.',
                icon: '💊',
                keywords: ['약', '복용', '처방', '투약'],
                improvement_tips: [
                    '현재 복용 중인 모든 약물을 언급하세요',
                    '처방약과 일반약 모두 포함해서 말하세요',
                    '약물 복용 기간을 구체적으로 말하세요',
                    '약물에 대한 부작용이 있었는지 말하세요'
                ]
            },
            {
                id: 'history',
                title: '과거 병력과 알레르기 말하기',
                description: '과거 병력이나 알레르기가 있다면 미리 준비해두세요.',
                icon: '🏥',
                keywords: ['과거', '알레르기', '병력', '만성'],
                improvement_tips: [
                    '과거에 비슷한 증상이 있었는지 말하세요',
                    '알레르기가 있는지 확인하고 언급하세요',
                    '만성 질환이 있다면 반드시 말하세요',
                    '최근 수술이나 입원 경험이 있다면 언급하세요'
                ]
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
                    <div class="quest-title">
                        <span class="quest-icon">${quest.icon}</span>
                        ${quest.title}
                        ${gradeBadge}
                    </div>
                    <div class="quest-checkbox">
                        <input type="checkbox" id="quest-${quest.id}" ${this.completedQuests.has(quest.id) ? 'checked' : ''}>
                        <label for="quest-${quest.id}"></label>
                    </div>
                </div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-tips-toggle" data-quest-id="${quest.id}">
                    <span class="toggle-icon">💡</span>
                    <span class="toggle-text">팁 보기</span>
                </div>
                <div class="quest-tips-content" id="tips-${quest.id}" style="display: none;">
                    <div class="improvement-tips">
                        <h4>💡 개선 팁:</h4>
                        <ul>
                            ${quest.improvement_tips ? quest.improvement_tips.map(tip => `<li>${tip}</li>`).join('') : '<li>구체적으로 설명해보세요.</li>'}
                        </ul>
                    </div>
                </div>
            `;
            
            const checkbox = questElement.querySelector(`#quest-${quest.id}`);
            checkbox.addEventListener('change', () => {
                this.toggleQuestCompletion(quest.id);
            });
            
            // 팁 토글 버튼 이벤트
            const tipsToggle = questElement.querySelector('.quest-tips-toggle');
            const tipsContent = questElement.querySelector('.quest-tips-content');
            
            tipsToggle.addEventListener('click', () => {
                const isVisible = tipsContent.style.display !== 'none';
                tipsContent.style.display = isVisible ? 'none' : 'block';
                tipsToggle.querySelector('.toggle-text').textContent = isVisible ? '팁 보기' : '팁 숨기기';
                tipsToggle.querySelector('.toggle-icon').textContent = isVisible ? '💡' : '📖';
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
            const response = await fetch('http://localhost:5000/api/analyze-quest', {
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
                        keywords: quest.keywords,
                        improvement_tips: quest.improvement_tips
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