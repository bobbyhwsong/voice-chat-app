class VoiceChatInterface {
    constructor() {
        this.checkUserData();
        this.isRecording = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentAudio = null; // 현재 재생 중인 오디오 추적
        this.messageAdded = false; // 메시지 추가 여부 추적
        
        // API URL 동적 설정
        this.apiBaseUrl = this.getApiBaseUrl();
        
        // 전역 변수로 설정 (콘솔에서 수정 가능)
        window.voiceChat = this;
        
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
        
        // ngrok URL 자동 업데이트
        this.initializeNgrokUrlUpdate();
    }

    // API 기본 URL 동적 설정
    getApiBaseUrl() {
        // 1. URL 파라미터에서 백엔드 URL 확인
        const urlParams = new URLSearchParams(window.location.search);
        const backendUrl = urlParams.get('backend');
        if (backendUrl) {
            console.log('🔗 URL 파라미터에서 백엔드 URL 감지:', backendUrl);
            return backendUrl;
        }
        
        // 2. 전역 변수에서 확인
        if (window.API_BASE_URL) {
            console.log('🔗 전역 변수에서 백엔드 URL 감지:', window.API_BASE_URL);
            return window.API_BASE_URL;
        }
        
        // 3. 환경변수에서 확인 (Netlify용)
        if (window.API_BASE_URL) {
            console.log('🔗 환경변수에서 백엔드 URL 감지:', window.API_BASE_URL);
            return window.API_BASE_URL;
        }
        
        // 4. 기본값 (로컬 개발용)
        console.log('🔗 기본 백엔드 URL 사용:', 'http://localhost:5001');
        return 'http://localhost:5001';
    }

    // ngrok URL 자동 감지 및 업데이트
    async updateNgrokUrl() {
        try {
            // 로컬 서버에서 ngrok URL 가져오기
            const response = await fetch('http://localhost:5001/api/ngrok-url', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success' && data.ngrok_url) {
                // ngrok URL을 전역 변수로 설정
                window.API_BASE_URL = data.ngrok_url;
                this.apiBaseUrl = data.ngrok_url;
                
                console.log('✅ ngrok URL 자동 업데이트:', data.ngrok_url);
                
                // URL 표시 (선택사항)
                this.showNgrokUrlInfo(data.ngrok_url);
                
                return data.ngrok_url;
            } else {
                console.log('⚠️ ngrok URL을 가져올 수 없습니다:', data.message);
                return null;
            }
        } catch (error) {
            console.log('⚠️ ngrok URL 업데이트 실패 (로컬 서버에 접근할 수 없음):', error.message);
            return null;
        }
    }

    // ngrok URL 자동 업데이트 초기화
    async initializeNgrokUrlUpdate() {
        // Netlify 환경에서는 로컬 서버에 접근할 수 없으므로
        // 환경변수나 URL 파라미터를 우선 사용
        const isNetlify = window.location.hostname.includes('netlify.app');
        
        if (isNetlify) {
            console.log('🌐 Netlify 환경 감지 - 로컬 서버 접근 비활성화');
            return;
        }
        
        // 로컬 개발 환경에서만 ngrok URL 자동 감지 활성화
        console.log('🖥️ 로컬 환경 감지 - ngrok URL 자동 감지 활성화');
        
        // 페이지 로드 시 즉시 시도
        await this.updateNgrokUrl();
        
        // 30초마다 ngrok URL 확인
        setInterval(async () => {
            await this.updateNgrokUrl();
        }, 30000); // 30초마다
        
        // 네트워크 오류 시 재시도 간격 단축
        let retryCount = 0;
        const maxRetries = 5;
        
        const retryUpdate = async () => {
            const result = await this.updateNgrokUrl();
            if (!result && retryCount < maxRetries) {
                retryCount++;
                setTimeout(retryUpdate, 10000); // 10초 후 재시도
            } else {
                retryCount = 0; // 성공 시 카운터 리셋
            }
        };
        
        // 초기 재시도 시작
        setTimeout(retryUpdate, 10000);
    }

    // ngrok URL 정보 표시
    showNgrokUrlInfo(ngrokUrl) {
        // 기존 정보 제거
        const existingInfo = document.getElementById('ngrok-url-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // 새로운 정보 표시
        const infoDiv = document.createElement('div');
        infoDiv.id = 'ngrok-url-info';
        infoDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
            max-width: 300px;
            word-break: break-all;
        `;
        infoDiv.innerHTML = `
            <strong>🌐 ngrok URL:</strong><br>
            ${ngrokUrl}<br>
            <small>자동으로 감지되었습니다</small>
        `;
        
        document.body.appendChild(infoDiv);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (infoDiv.parentNode) {
                infoDiv.remove();
            }
        }, 5000);
    }

    checkUserData() {
        // 사용자 데이터 확인
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
    }

    initializeSpeechRecognition() {
        // Web Speech API 지원 확인
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('이 브라우저는 음성 인식을 지원하지 않습니다.');
            return;
        }

        // Speech Recognition 초기화
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

    // 현재 재생 중인 오디오 중단
    stopCurrentAudio() {
        if (this.currentAudio) {
            // 이벤트 리스너 제거
            this.currentAudio.onended = null;
            this.currentAudio.onerror = null;
            this.currentAudio.onloadstart = null;
            this.currentAudio.oncanplay = null;
            this.currentAudio.onplay = null;
            
            // 오디오 중단
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // 브라우저 내장 TTS도 중단
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        
        console.log('기존 음성이 중단되었습니다.');
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

    bindEvents() {
        // 텍스트 전송
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 음성 입력
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());

        // 음성 멈춤
        this.stopVoiceBtn.addEventListener('click', () => this.stopAllAudio());

        // 대화 초기화
        this.clearBtn.addEventListener('click', () => this.clearConversation());
        
        // 로그 조회
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

    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isRecording = false;
        this.voiceBtn.classList.remove('recording');
                    this.voiceBtn.querySelector('.mic-text').textContent = '증상 음성 입력';
        this.voiceStatus.textContent = '';
    }

    sendMessage() {
        const message = this.textInput.value.trim();
        if (!message) return;

        this.stopCurrentAudio(); // 메시지 전송 시 현재 재생 중인 오디오 중단
        
        // 사용자 메시지 추가
        this.addMessage(message, 'user', false);
        this.textInput.value = '';

        // 챗봇 응답 생성
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

        // 봇 메시지인 경우 음성으로 읽기 (speak 파라미터가 true일 때만)
        if (sender === 'bot' && speak) {
            this.speakMessage(content);
        }
    }

    addMessageWithVoice(content, sender) {
        // 음성이 준비되면 채팅 메시지를 표시하는 새로운 함수
        this.speakMessageAndShowChat(content, sender);
    }

    async generateBotResponse(userMessage) {
        try {
            // 로딩 메시지 표시 (음성 없이)
            this.addMessage('생각 중입니다...', 'bot', false);
            
            // 사용자 정보 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            // LLM API 호출
            const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    participant_id: participantId,
                    page_type: 'chat'  // chat.html 페이지 타입
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                // 로딩 메시지를 실제 응답으로 교체
                this.replaceLoadingMessage(data.response);
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
            
            // 로딩 메시지 제거
            const loadingMessage = this.chatMessages.lastElementChild;
            if (loadingMessage && loadingMessage.querySelector('.message-content').textContent === '생각 중입니다...') {
                loadingMessage.remove();
            }
            
            this.addMessage('네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.', 'bot');
        }
    }

    async speakMessage(text) {
        try {
            // 이전 오디오 중단 (더 확실하게)
            this.stopCurrentAudio();
            
            // ElevenLabs TTS API 호출
            // 사용자 ID 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || localStorage.getItem('participantId');
            
            const response = await fetch(`${this.apiBaseUrl}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    participant_id: participantId
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                // 오디오 파일 재생
                const audio = new Audio(`${this.apiBaseUrl}${data.audio_url}`);
                audio.volume = 1.0;
                
                // 현재 오디오 추적
                this.currentAudio = audio;
                
                audio.onloadstart = () => {
                    console.log('ElevenLabs 50대 남성 의사 음성 재생 시작');
                };
                
                audio.onended = () => {
                    console.log('ElevenLabs 음성 재생 완료');
                    this.currentAudio = null;
                };
                
                audio.onerror = (event) => {
                    console.error('ElevenLabs 음성 재생 오류:', event.error);
                    this.currentAudio = null;
                    // 오류 시 브라우저 내장 TTS로 폴백
                    this.fallbackTTS(text);
                };
                
                // 재생 시작 전 한 번 더 확인
                this.stopCurrentAudio();
                await audio.play();
                
            } else {
                console.error('ElevenLabs TTS 오류:', data.error);
                // 오류 시 브라우저 내장 TTS로 폴백
                this.fallbackTTS(text);
            }
            
        } catch (error) {
            console.error('ElevenLabs TTS 네트워크 오류:', error);
            // 오류 시 브라우저 내장 TTS로 폴백
            this.fallbackTTS(text);
        }
    }

    // 로딩 메시지를 실제 응답으로 교체
    replaceLoadingMessage(response) {
        const loadingMessage = this.chatMessages.lastElementChild;
        if (loadingMessage && loadingMessage.querySelector('.message-content').textContent === '생각 중입니다...') {
            // 로딩 메시지 제거
            loadingMessage.remove();
        }
        
        // 음성과 함께 메시지 표시 (음성이 준비되면 채팅도 표시)
        this.addMessageWithVoice(response, 'bot');
    }

    async speakMessageAndShowChat(text, sender) {
        try {
            // 이전 오디오 중단 (더 확실하게)
            this.stopCurrentAudio();
            
            // 메시지 추가 플래그 초기화
            this.messageAdded = false;
            
            // 먼저 채팅 메시지를 표시 (음성과 관계없이)
            this.addMessage(text, sender, false);
            this.messageAdded = true;
            
            // ElevenLabs TTS API 호출
            // 사용자 ID 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || localStorage.getItem('participantId');
            
            const response = await fetch(`${this.apiBaseUrl}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    participant_id: participantId
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                // 오디오 파일 준비
                const audio = new Audio(`${this.apiBaseUrl}${data.audio_url}`);
                audio.volume = 1.0;
                
                // 현재 오디오 추적
                this.currentAudio = audio;
                
                // 오디오가 로드되면 음성 재생 시작
                audio.oncanplay = () => {
                    console.log('ElevenLabs 음성 준비 완료 - 음성 재생 시작');
                    // 재생 시작 전 한 번 더 확인
                    this.stopCurrentAudio();
                    audio.play();
                };
                
                audio.onloadstart = () => {
                    console.log('ElevenLabs 50대 남성 의사 음성 재생 시작');
                };
                
                audio.onended = () => {
                    console.log('ElevenLabs 음성 재생 완료');
                    this.currentAudio = null;
                };
                
                audio.onerror = (event) => {
                    console.error('ElevenLabs 음성 재생 오류:', event.error);
                    this.currentAudio = null;
                    // 오류 시 브라우저 내장 TTS로 폴백
                    this.fallbackTTS(text);
                };
                
                // 오디오 로드 시작
                await audio.load();
                // 재생 시작 전 한 번 더 확인
                this.stopCurrentAudio();
                await audio.play();
                
            } else {
                console.error('ElevenLabs TTS 오류:', data.error);
                // 오류 시 브라우저 내장 TTS로 폴백
                this.fallbackTTS(text);
            }
            
        } catch (error) {
            console.error('ElevenLabs TTS 네트워크 오류:', error);
            // 오류 시 브라우저 내장 TTS로 폴백
            this.fallbackTTS(text);
        }
    }

    fallbackTTS(text) {
        // 브라우저 내장 TTS (폴백)
        this.stopCurrentAudio(); // 이전 음성 중단

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.volume = 1.0;

        utterance.onstart = () => {
            console.log('브라우저 내장 TTS 시작 (폴백)');
        };

        utterance.onend = () => {
            console.log('브라우저 내장 TTS 완료');
        };

        utterance.onerror = (event) => {
            console.error('브라우저 내장 TTS 오류:', event.error);
        };

        // TTS 시작 전 한 번 더 확인
        this.stopCurrentAudio();
        this.synthesis.speak(utterance);
    }

    fallbackTTSWithChat(text, sender) {
        // 브라우저 내장 TTS와 함께 채팅 표시 (폴백)
        this.stopCurrentAudio(); // 이전 음성 중단

        // 채팅 메시지가 이미 표시되었는지 확인
        if (!this.messageAdded) {
            this.addMessage(text, sender, false);
            this.messageAdded = true;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.volume = 1.0;

        utterance.onstart = () => {
            console.log('브라우저 내장 TTS 시작 (폴백)');
        };

        utterance.onend = () => {
            console.log('브라우저 내장 TTS 완료');
        };

        utterance.onerror = (event) => {
            console.error('브라우저 내장 TTS 오류:', event.error);
        };

        // TTS 시작 전 한 번 더 확인
        this.stopCurrentAudio();
        this.synthesis.speak(utterance);
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

    async clearConversation() {
        // 확인 창 표시
        const confirmed = confirm('정말로 진료 세션을 초기화하시겠습니까?\n\n모든 대화 내용이 삭제됩니다.');
        
        if (!confirmed) {
            return;
        }
        
        try {
            // 서버에 대화 초기화 요청
            await fetch(`${this.apiBaseUrl}/api/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // 채팅 메시지 초기화 (첫 번째 메시지 제외)
            const messages = this.chatMessages.querySelectorAll('.message');
            for (let i = 1; i < messages.length; i++) {
                messages[i].remove();
            }

            // 초기화 완료 메시지
            this.addMessage('진료 세션이 초기화되었습니다.', 'bot');
            
        } catch (error) {
            console.error('대화 초기화 오류:', error);
            this.addMessage('진료 세션 초기화 중 오류가 발생했습니다.', 'bot');
        }
    }

    async viewLogs() {
        try {
            // 사용자 정보 가져오기
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
        // 모달 생성
        const modal = document.createElement('div');
        modal.className = 'logs-modal';
        modal.innerHTML = `
            <div class="logs-modal-content">
                <div class="logs-modal-header">
                    <h3>진료 대화 로그 (${date})${participantId ? ` - ${participantId}` : ''}</h3>
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
        
        // 닫기 버튼 이벤트
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message bot-message';
        errorDiv.innerHTML = `
            <div class="message-content" style="color: #dc3545;">
                ⚠️ ${message}
            </div>
            <div class="message-time">지금</div>
        `;
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
    }
}

// API 기본 URL 설정 함수
function getApiBaseUrl() {
    // 1. URL 파라미터에서 백엔드 URL 확인
    const urlParams = new URLSearchParams(window.location.search);
    const backendUrl = urlParams.get('backend');
    if (backendUrl) {
        return backendUrl;
    }
    
    // 2. 전역 변수에서 확인
    if (window.API_BASE_URL) {
        return window.API_BASE_URL;
    }
    
            // 3. 환경변수에서 확인 (Netlify용)
        if (window.API_BASE_URL) {
            return window.API_BASE_URL;
        }
    
    // 4. 기본값 (로컬 개발용)
    return 'http://localhost:5001';
}

// API 기본 URL 설정
window.API_BASE_URL = getApiBaseUrl();

// 디버깅용 로그
console.log('API Base URL:', window.API_BASE_URL);

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new VoiceChatInterface();
});

// 브라우저 호환성 체크
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
}

if (!('speechSynthesis' in window)) {
    console.warn('이 브라우저는 음성 합성을 지원하지 않습니다.');
} 