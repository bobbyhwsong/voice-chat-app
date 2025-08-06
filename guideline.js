class GuidelineManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkUserData();
    }

    initializeElements() {
        this.checkboxes = document.querySelectorAll('.check-input');
        this.startBtn = document.getElementById('startBtn');
    }

    bindEvents() {
        // 체크박스 변경 이벤트
        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.validateChecklist());
        });
        
        // 시작 버튼 클릭 이벤트
        this.startBtn.addEventListener('click', () => this.startPractice());
    }

    checkUserData() {
        // 사용자 데이터 확인
        const userData = localStorage.getItem('userData');
        if (!userData) {
                    // 로그인 페이지로 리다이렉트
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

    validateChecklist() {
        const allChecked = Array.from(this.checkboxes).every(checkbox => checkbox.checked);
        
        if (allChecked) {
            this.startBtn.disabled = false;
            this.startBtn.style.opacity = '1';
        } else {
            this.startBtn.disabled = true;
            this.startBtn.style.opacity = '0.7';
        }
    }

    startPractice() {
        // 사용자 데이터에 가이드라인 완료 시간 추가
        const userData = JSON.parse(localStorage.getItem('userData'));
        userData.guidelineCompleted = new Date().toISOString();
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // 진료 연습 페이지로 이동
        window.location.href = 'chat.html';
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new GuidelineManager();
}); 