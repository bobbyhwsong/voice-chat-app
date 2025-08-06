class FeedbackManager {
    constructor() {
        this.initializeElements();
        this.loadConversationData();
        this.analyzeConversation();
        this.scoreReasons = {}; // 점수 이유를 저장할 객체
        this.gradeCounts = { 상: 0, 중: 0, 하: 0 }; // 등급별 개수
    }

    initializeElements() {
        this.conversationLog = document.getElementById('conversationLog');
        this.overallScore = document.getElementById('overallScore');
        this.scoreTitle = document.getElementById('scoreTitle');
        this.scoreDescription = document.getElementById('scoreDescription');
        this.improvementTips = document.getElementById('improvementTips');
    }

    async loadConversationData() {
        try {
            // 사용자 정보 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            // 대화 로그 가져오기
            const response = await fetch(`http://localhost:5000/api/logs?participant_id=${participantId || ''}`);
            const data = await response.json();
            
            if (data.status === 'success' && data.logs.length > 0) {
                this.displayConversationLog(data.logs);
                this.analyzeConversation(data.logs);
            } else {
                this.showNoDataMessage();
            }
        } catch (error) {
            console.error('대화 로그 로드 오류:', error);
            this.showNoDataMessage();
        }
    }

    displayConversationLog(logs) {
        this.conversationLog.innerHTML = '';
        
        logs.forEach(log => {
            const entry = document.createElement('div');
            entry.className = 'conversation-entry user';
            
            const speaker = document.createElement('div');
            speaker.className = 'speaker';
            speaker.textContent = '환자';
            
            const message = document.createElement('div');
            message.className = 'message';
            message.textContent = log.user_message;
            
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = new Date(log.timestamp).toLocaleString('ko-KR');
            
            entry.appendChild(speaker);
            entry.appendChild(message);
            entry.appendChild(timestamp);
            this.conversationLog.appendChild(entry);
            
            // 의사 응답
            const doctorEntry = document.createElement('div');
            doctorEntry.className = 'conversation-entry doctor';
            
            const doctorSpeaker = document.createElement('div');
            doctorSpeaker.className = 'speaker';
            doctorSpeaker.textContent = '의사';
            
            const doctorMessage = document.createElement('div');
            doctorMessage.className = 'message';
            doctorMessage.textContent = log.bot_response;
            
            const doctorTimestamp = document.createElement('div');
            doctorTimestamp.className = 'timestamp';
            doctorTimestamp.textContent = new Date(log.timestamp).toLocaleString('ko-KR');
            
            doctorEntry.appendChild(doctorSpeaker);
            doctorEntry.appendChild(doctorMessage);
            doctorEntry.appendChild(doctorTimestamp);
            this.conversationLog.appendChild(doctorEntry);
        });
    }

    showNoDataMessage() {
        this.conversationLog.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">대화 로그가 없습니다.</p>';
        this.overallScore.textContent = '0';
        this.scoreTitle.textContent = '데이터 없음';
        this.scoreDescription.textContent = '진료 연습을 먼저 진행해주세요.';
    }

    async analyzeConversation(logs = []) {
        if (logs.length === 0) return;

        try {
            // 사용자 정보 가져오기
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const participantId = userData.participantId || null;
            
            // LLM 평가 API 호출 - 구체적인 대화로그 기반 평가 요청
            const response = await fetch('http://localhost:5000/api/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logs: logs,
                    participant_id: participantId,
                    evaluation_type: 'conversation_based' // 구체적인 대화로그 기반 평가 요청
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const evaluation = data.evaluation;
                
                // 점수 이유 저장
                this.scoreReasons = evaluation.score_reasons || {};
                
                // 상/중/하 등급으로 변환된 점수 사용
                const grades = evaluation.grades || {};
                
                // 등급 표시 및 개수 계산 (종합 점수도 함께 계산됨)
                this.displayGrades(grades);
                
                // 점수 이유 표시
                this.displayScoreReasons(evaluation.score_reasons || {});
                
                // 개선 제안 표시 (하 등급 항목에 대해서만)
                this.displayImprovementTips(evaluation.improvement_tips, grades);
                
                // 피드백 데이터가 저장되었음을 표시
                console.log('피드백 데이터가 사용자별 폴더에 저장되었습니다.');
            } else {
                console.error('평가 API 오류:', data.error);
                this.showEvaluationError();
            }
        } catch (error) {
            console.error('평가 요청 오류:', error);
            this.showEvaluationError();
        }
    }

    displayGrades(grades) {
        // 등급별 개수 초기화
        this.gradeCounts = { 상: 0, 중: 0, 하: 0 };
        
        // 등급 표시 및 개수 계산 (동기적으로 처리)
        Object.keys(grades).forEach(key => {
            const gradeElement = document.getElementById(`${key}Grade`);
            const scoreElement = document.getElementById(`${key}Score`);
            const textElement = document.getElementById(`${key}Text`);
            
            if (gradeElement && scoreElement && textElement) {
                const grade = grades[key];
                
                // 등급 표시
                gradeElement.textContent = grade;
                
                // 등급별 색상 적용 및 개수 계산
                if (grade === '상') {
                    gradeElement.className = 'grade-badge excellent';
                    scoreElement.style.width = '100%';
                    textElement.textContent = '100%';
                    this.gradeCounts.상++;
                } else if (grade === '중') {
                    gradeElement.className = 'grade-badge good';
                    scoreElement.style.width = '60%';
                    textElement.textContent = '60%';
                    this.gradeCounts.중++;
                } else {
                    gradeElement.className = 'grade-badge poor';
                    scoreElement.style.width = '30%';
                    textElement.textContent = '30%';
                    this.gradeCounts.하++;
                }
            }
        });
        
        // 등급 표시 완료 후 종합 점수 계산
        const overallScore = this.calculateOverallScoreFromGrades();
        const overallGrade = this.getOverallGrade(overallScore);
        const overallDescription = this.getOverallDescription(overallScore);
        
        // 종합 점수 표시
        this.displayOverallScore(overallScore, overallGrade, overallDescription);
    }

    displayScoreReasons(scoreReasons) {
        // 점수 이유 표시
        Object.keys(scoreReasons).forEach(key => {
            const reasonElement = document.getElementById(`${key}ReasonText`);
            if (reasonElement) {
                reasonElement.textContent = scoreReasons[key];
            }
        });
    }

    calculateOverallScoreFromGrades() {
        const totalItems = this.gradeCounts.상 + this.gradeCounts.중 + this.gradeCounts.하;
        
        if (totalItems === 0) return 0;
        
        // 상: 100점, 중: 60점, 하: 30점으로 계산
        const totalScore = (this.gradeCounts.상 * 100) + (this.gradeCounts.중 * 60) + (this.gradeCounts.하 * 30);
        return Math.round(totalScore / totalItems);
    }

    getOverallGrade(score) {
        if (score >= 90) return '우수';
        else if (score >= 70) return '양호';
        else if (score >= 50) return '보통';
        else return '개선 필요';
    }

    getOverallDescription(score) {
        if (score >= 90) return '핵심 체크리스트를 매우 잘 준수했습니다.';
        else if (score >= 70) return '대부분의 핵심 체크리스트를 잘 준수했습니다.';
        else if (score >= 50) return '일부 핵심 체크리스트를 준수했습니다.';
        else return '핵심 체크리스트 준수도가 낮습니다. 개선이 필요합니다.';
    }

    displayOverallScore(score, grade, description) {
        this.overallScore.textContent = score;
        this.scoreTitle.textContent = grade;
        this.scoreDescription.textContent = description;
    }

    displayImprovementTips(tips, grades) {
        this.improvementTips.innerHTML = '';
        
        // 하 등급을 받은 항목들 찾기
        const poorItems = Object.keys(grades).filter(key => grades[key] === '하');
        
        if (poorItems.length > 0) {
            // 하 등급 항목에 대한 개선 제안 표시
            if (tips && tips.length > 0) {
                tips.forEach(tip => {
                    const tipElement = document.createElement('div');
                    tipElement.className = 'tip-item important';
                    tipElement.textContent = tip;
                    this.improvementTips.appendChild(tipElement);
                });
            } else {
                // 기본 개선 제안
                poorItems.forEach(item => {
                    const tipElement = document.createElement('div');
                    tipElement.className = 'tip-item important';
                    tipElement.textContent = `${this.getItemLabel(item)} 항목을 개선해주세요.`;
                    this.improvementTips.appendChild(tipElement);
                });
            }
        } else {
            // 모든 항목이 상/중 등급인 경우
            const tipElement = document.createElement('div');
            tipElement.className = 'tip-item';
            tipElement.textContent = '훌륭합니다! 핵심 체크리스트를 잘 준수했습니다.';
            this.improvementTips.appendChild(tipElement);
        }
    }

    getItemLabel(itemKey) {
        const labels = {
            'symptom_location': '어디가 아픈지 구체적인 위치',
            'symptom_timing': '언제부터 아픈지 시작 시기',
            'symptom_severity': '증상이 얼마나 심한지 강도',
            'current_medication': '현재 복용 중인 약물',
            'allergy_info': '알레르기 여부',
            'diagnosis_info': '의사의 진단명과 진단 근거',
            'prescription_info': '처방약의 이름과 복용 방법',
            'side_effects': '약의 부작용과 주의사항',
            'followup_plan': '다음 진료 계획과 재방문 시기',
            'emergency_plan': '증상 악화 시 언제 다시 와야 하는지'
        };
        return labels[itemKey] || itemKey;
    }

    showEvaluationError() {
        this.overallScore.textContent = '0';
        this.scoreTitle.textContent = '평가 오류';
        this.scoreDescription.textContent = '평가 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
}

// 토글 기능 함수 (전역 함수)
function toggleScoreReason(itemKey) {
    const reasonElement = document.getElementById(`${itemKey}Reason`);
    if (reasonElement) {
        if (reasonElement.style.display === 'none') {
            reasonElement.style.display = 'block';
        } else {
            reasonElement.style.display = 'none';
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackManager = new FeedbackManager();
}); 