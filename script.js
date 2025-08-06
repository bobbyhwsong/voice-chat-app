class VoiceChatInterface {
    constructor() {
        this.checkUserData();
        this.isRecording = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentAudio = null; // 현재 재생 중인 오디오 추적
        
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
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
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // 브라우저 내장 TTS도 중단
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
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
            
            // 로딩 메시지 제거
            const loadingMessage = this.chatMessages.lastElementChild;
            if (loadingMessage && loadingMessage.querySelector('.message-content').textContent === '생각 중입니다...') {
                loadingMessage.remove();
            }

            if (data.status === 'success') {
                // 음성과 함께 메시지 표시 (음성이 준비되면 채팅도 표시)
                this.addMessageWithVoice(data.response, 'bot');
            } else {
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
            // 이전 오디오 중단
            this.stopCurrentAudio();
            
            // ElevenLabs TTS API 호출
            // 사용자 ID 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || localStorage.getItem('participantId');
            
            const response = await fetch('http://localhost:5000/api/tts', {
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
                const audio = new Audio(`http://localhost:5000${data.audio_url}`);
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

    async speakMessageAndShowChat(text, sender) {
        try {
            // 이전 오디오 중단
            this.stopCurrentAudio();
            
            // ElevenLabs TTS API 호출
            // 사용자 ID 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || localStorage.getItem('participantId');
            
            const response = await fetch('http://localhost:5000/api/tts', {
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
                const audio = new Audio(`http://localhost:5000${data.audio_url}`);
                audio.volume = 1.0;
                
                // 현재 오디오 추적
                this.currentAudio = audio;
                
                // 오디오가 로드되면 채팅 메시지 표시
                audio.oncanplay = () => {
                    console.log('ElevenLabs 음성 준비 완료 - 채팅 메시지 표시');
                    this.addMessage(text, sender, false); // 채팅 메시지 표시 (음성 재생 없이)
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
                    this.fallbackTTSWithChat(text, sender);
                };
                
                // 오디오 로드 시작
                await audio.load();
                await audio.play();
                
            } else {
                console.error('ElevenLabs TTS 오류:', data.error);
                // 오류 시 브라우저 내장 TTS로 폴백
                this.fallbackTTSWithChat(text, sender);
            }
            
        } catch (error) {
            console.error('ElevenLabs TTS 네트워크 오류:', error);
            // 오류 시 브라우저 내장 TTS로 폴백
            this.fallbackTTSWithChat(text, sender);
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

        this.synthesis.speak(utterance);
    }

    fallbackTTSWithChat(text, sender) {
        // 브라우저 내장 TTS와 함께 채팅 표시 (폴백)
        this.stopCurrentAudio(); // 이전 음성 중단

        // 채팅 메시지 먼저 표시
        this.addMessage(text, sender, false);

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
            await fetch('http://localhost:5000/api/clear', {
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