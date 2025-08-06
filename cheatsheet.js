// 치트시트 페이지 JavaScript

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    initializeCheatsheet();
});

// 치트시트 초기화
function initializeCheatsheet() {
    // 마지막 대화 내용을 기반으로 치트시트 생성
    generateDynamicCheatsheet();
}

// LLM을 사용한 맞춤형 치트시트 생성
async function generateDynamicCheatsheet() {
    try {
        // 사용자 정보 가져오기
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const participantId = userData.participantId || localStorage.getItem('participantId');
        
        if (!participantId) {
            showNotification('사용자 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 로딩 표시
        showLoadingState();
        
        // LLM API 호출
                    // API URL 동적 설정
            const apiBaseUrl = window.API_BASE_URL || 'http://localhost:5001';
            
            const response = await fetch(`${apiBaseUrl}/api/generate-cheatsheet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                participant_id: participantId
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // 치트시트 데이터 표시
            displayCheatsheet(data.cheatsheet);
            showNotification('진료 스크립트가 성공적으로 생성되었습니다.', 'success');
        } else {
            console.error('치트시트 생성 오류:', data.error);
            showNotification('스크립트 생성 중 오류가 발생했습니다.', 'error');
            showDefaultCheatsheet();
        }
        
    } catch (error) {
        console.error('치트시트 생성 네트워크 오류:', error);
        showNotification('서버 연결에 실패했습니다.', 'error');
        showDefaultCheatsheet();
    }
}

// 로딩 상태 표시
function showLoadingState() {
    const scriptContent = document.getElementById('scriptContent');
    const questionsContent = document.getElementById('questionsContent');
    const myQuestionsContent = document.getElementById('myQuestionsContent');
    const precautionsContent = document.getElementById('precautionsContent');
    
    scriptContent.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">AI가 맞춤형 스크립트를 생성하고 있습니다...</div>';
    questionsContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">생성 중...</div>';
    myQuestionsContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">생성 중...</div>';
    precautionsContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">생성 중...</div>';
}

// 스크립트 데이터 표시
function displayCheatsheet(cheatsheetData) {
    const cheatsheet = cheatsheetData.cheatsheet;
    
    // 스크립트 표시
    displayScript(cheatsheet.script);
    
    // 질문과 답변 표시
    displayQuestions(cheatsheet.questions);
    
    // 내 질문 표시
    displayMyQuestions(cheatsheet.my_questions);
    
    // 주의사항 표시
    displayPrecautions(cheatsheet.precautions);
}

// 스크립트 표시
function displayScript(script) {
    const scriptContent = document.getElementById('scriptContent');
    
    if (!script || script.length === 0) {
        scriptContent.innerHTML = '<div class="script-item"><p>생성된 스크립트가 없습니다.</p></div>';
        return;
    }
    
    let html = '';
    script.forEach((item, index) => {
        html += `
            <div class="script-item">
                <h4>${item.title || `스크립트 ${index + 1}`}</h4>
                <p>${item.content}</p>
            </div>
        `;
    });
    
    scriptContent.innerHTML = html;
}

// 질문과 답변 표시
function displayQuestions(questions) {
    const questionsContent = document.getElementById('questionsContent');
    
    if (!questions || questions.length === 0) {
        questionsContent.innerHTML = '<div class="question-item"><p>생성된 질문이 없습니다.</p></div>';
        return;
    }
    
    let html = '';
    questions.forEach((item, index) => {
        html += `
            <div class="question-item">
                <h4>${item.title || `질문 ${index + 1}`}</h4>
                <div class="question">${item.question}</div>
                ${item.answer ? `<div class="answer">${item.answer}</div>` : ''}
            </div>
        `;
    });
    
    questionsContent.innerHTML = html;
}

// 내 질문 표시
function displayMyQuestions(myQuestions) {
    const myQuestionsContent = document.getElementById('myQuestionsContent');
    
    if (!myQuestions || myQuestions.length === 0) {
        myQuestionsContent.innerHTML = '<div class="my-question-item"><p>생성된 질문이 없습니다.</p></div>';
        return;
    }
    
    let html = '';
    myQuestions.forEach((item, index) => {
        html += `
            <div class="my-question-item">
                <h4>${item.title || `내 질문 ${index + 1}`}</h4>
                <div class="question">${item.question}</div>
            </div>
        `;
    });
    
    myQuestionsContent.innerHTML = html;
}

// 주의사항 표시
function displayPrecautions(precautions) {
    const precautionsContent = document.getElementById('precautionsContent');
    
    if (!precautions || precautions.length === 0) {
        precautionsContent.innerHTML = '<div class="precautions-item"><p>생성된 주의사항이 없습니다.</p></div>';
        return;
    }
    
    let html = '';
    precautions.forEach((item, index) => {
        html += `
            <div class="precautions-item">
                <h4>${item.title || `주의사항 ${index + 1}`}</h4>
                <p>${item.content}</p>
            </div>
        `;
    });
    
    precautionsContent.innerHTML = html;
}

// 기본 치트시트 표시
function showDefaultCheatsheet() {
    const scriptContent = document.getElementById('scriptContent');
    const questionsContent = document.getElementById('questionsContent');
    const myQuestionsContent = document.getElementById('myQuestionsContent');
    const precautionsContent = document.getElementById('precautionsContent');
    
    scriptContent.innerHTML = `
        <div class="script-item">
            <h4>기본 인사말</h4>
            <p>"안녕하세요, 의사선생님. 저는 [이름]입니다. 오늘 [증상] 때문에 방문했습니다."</p>
        </div>
        <div class="script-item">
            <h4>증상 설명</h4>
            <p>"[증상]이 [언제부터] 시작되어서 [어떤 정도]로 나타나고 있습니다."</p>
        </div>
    `;
    
    questionsContent.innerHTML = `
        <div class="question-item">
            <h4>증상 관련 질문</h4>
            <div class="question">"언제부터 증상이 나타났나요?"</div>
            <div class="answer">"약 [시간/일] 전부터 시작되었습니다."</div>
        </div>
        <div class="question-item">
            <h4>통증 관련 질문</h4>
            <div class="question">"통증의 정도는 어느 정도인가요?"</div>
            <div class="answer">"10점 만점에 약 [숫자]점 정도입니다."</div>
        </div>
    `;
    
    myQuestionsContent.innerHTML = `
        <div class="my-question-item">
            <h4>치료 관련 질문</h4>
            <div class="question">"이 병은 얼마나 오래 치료해야 하나요?"</div>
        </div>
        <div class="my-question-item">
            <h4>생활 관리 질문</h4>
            <div class="question">"일상생활에서 주의해야 할 점이 있나요?"</div>
        </div>
    `;
    
    precautionsContent.innerHTML = `
        <div class="precautions-item">
            <h4>약물 복용 주의사항</h4>
            <p>처방받은 약을 정확한 시간에 복용하고, 부작용이 나타나면 즉시 의료진에 연락하세요.</p>
        </div>
        <div class="precautions-item">
            <h4>증상 악화 시 대응</h4>
            <p>증상이 악화되거나 새로운 증상이 나타나면 즉시 병원을 방문하세요.</p>
        </div>
    `;
}

// 치트시트 전체 복사
function copyCheatsheet() {
    const cheatsheetContainer = document.getElementById('cheatsheetContainer');
    const text = extractTextContent(cheatsheetContainer);
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('전체 내용이 클립보드에 복사되었습니다.', 'success');
    }).catch(() => {
        // 폴백 방법
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('전체 내용이 클립보드에 복사되었습니다.', 'success');
    });
}

// 텍스트 내용 추출
function extractTextContent(element) {
    let text = '';
    
    function extract(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent.trim() + ' ';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'H3' || node.tagName === 'H4') {
                text += '\n\n' + node.textContent.trim() + '\n';
            } else if (node.tagName === 'P') {
                text += node.textContent.trim() + '\n';
            } else if (node.tagName === 'LI') {
                text += '• ' + node.textContent.trim() + '\n';
            } else {
                for (let child of node.childNodes) {
                    extract(child);
                }
            }
        }
    }
    
    extract(element);
    return text.trim();
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2em;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 애니메이션 표시
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 자동 제거
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 치트시트 완료
function finishCheatsheet() {
    const popupOverlay = document.getElementById('popupOverlay');
    popupOverlay.classList.add('show');
}

// 팝업 닫기
function closePopup() {
    const popupOverlay = document.getElementById('popupOverlay');
    popupOverlay.classList.remove('show');
}

// 홈으로 가기
function goHome() {
    window.location.href = 'index.html';
} 