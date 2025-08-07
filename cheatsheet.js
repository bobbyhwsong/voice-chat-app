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
        
        // 음성 분석 먼저 수행
        await generateVoiceAnalysis(participantId);
        
        // LLM API 호출
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

// 음성 분석 생성
async function generateVoiceAnalysis(participantId) {
    try {
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:5001';
        
        // 대화 로그 가져오기
        const logsResponse = await fetch(`${apiBaseUrl}/api/logs?participant_id=${participantId}&page_type=chat`);
        const logsData = await logsResponse.json();
        
        if (logsData.status === 'success' && logsData.logs.length > 0) {
            // 사용자 메시지만 추출
            const userMessages = logsData.logs
                .filter(log => log.user_message)
                .map(log => log.user_message);
            
            // 음성 분석 API 호출
            const analysisResponse = await fetch(`${apiBaseUrl}/api/analyze-voice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: userMessages,
                    participant_id: participantId,
                    analysis_type: 'voice_analysis'
                })
            });
            
            const analysisData = await analysisResponse.json();
            
            if (analysisData.status === 'success') {
                displayVoiceAnalysis(analysisData.analysis);
            }
        }
    } catch (error) {
        console.error('음성 분석 오류:', error);
    }
}

// 음성 분석 결과 표시
function displayVoiceAnalysis(analysis) {
    const voiceAnalysis = document.getElementById('voiceAnalysis');
    const analysisContent = voiceAnalysis.querySelector('.analysis-content');
    
    let html = `
        <div class="analysis-summary">
            <p><strong>${analysis.summary}</strong></p>
        </div>
        <div class="analysis-details">
            <p>${analysis.details}</p>
        </div>
        <div class="analysis-aspects">
            <h5>👍 긍정적인 면</h5>
            <ul>
                ${analysis.positive_aspects.map(aspect => `<li>${aspect}</li>`).join('')}
            </ul>
        </div>
        <div class="analysis-suggestions">
            <h5>💡 제안사항</h5>
            <ul>
                ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
        </div>
    `;
    
    analysisContent.innerHTML = html;
}

// 로딩 상태 표시
function showLoadingState() {
    const scriptContent = document.getElementById('scriptContent');
    const listeningContent = document.getElementById('listeningContent');
    const precautionsContent = document.getElementById('precautionsContent');
    
    scriptContent.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">AI가 맞춤형 스크립트를 생성하고 있습니다...</div>';
    listeningContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">생성 중...</div>';
    precautionsContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">생성 중...</div>';
}

// 스크립트 데이터 표시
function displayCheatsheet(cheatsheetData) {
    const cheatsheet = cheatsheetData.cheatsheet;
    
    // 스크립트 표시
    displayScript(cheatsheet.script);
    
    // 들어야 하는 것 표시
    displayListening(cheatsheet.listening);
    
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
    
    let html = '<div class="script-intro"><h4>🎯 무조건 말해야 하는 것 (5개)</h4></div>';
    script.forEach((item, index) => {
        html += `
            <div class="script-item">
                <h4>${item.title || `핵심 ${index + 1}`}</h4>
                <div class="script-content">
                    <p class="actual-script">${item.content}</p>
                </div>
            </div>
        `;
    });
    
    scriptContent.innerHTML = html;
}

// 들어야 하는 것 표시
function displayListening(listening) {
    const listeningContent = document.getElementById('listeningContent');
    
    if (!listening || listening.length === 0) {
        listeningContent.innerHTML = '<div class="listening-item"><p>생성된 내용이 없습니다.</p></div>';
        return;
    }
    
    let html = '<div class="listening-intro"><h4>🎯 무조건 들어야 하는 것 (5개)</h4></div>';
    listening.forEach((item, index) => {
        html += `
            <div class="listening-item">
                <h4>${item.title || `핵심 ${index + 1}`}</h4>
                <div class="listening-content">
                    <p class="doctor-script">${item.content}</p>
                </div>
            </div>
        `;
    });
    
    listeningContent.innerHTML = html;
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
    const listeningContent = document.getElementById('listeningContent');
    const precautionsContent = document.getElementById('precautionsContent');
    
    scriptContent.innerHTML = `
        <div class="script-intro"><h4>🎯 무조건 말해야 하는 것 (5개)</h4></div>
        <div class="script-item">
            <h4>증상 위치</h4>
            <div class="script-content">
                <p class="actual-script">어디가 아픈지 구체적으로 말씀드리겠습니다.</p>
            </div>
        </div>
        <div class="script-item">
            <h4>증상 시작 시기</h4>
            <div class="script-content">
                <p class="actual-script">언제부터 아픈지 정확히 말씀드리겠습니다.</p>
            </div>
        </div>
    `;
    
    listeningContent.innerHTML = `
        <div class="listening-intro"><h4>🎯 무조건 들어야 하는 것 (5개)</h4></div>
        <div class="listening-item">
            <h4>진단명과 근거</h4>
            <div class="listening-content">
                <p class="doctor-script">진단명과 그 근거를 설명드리겠습니다.</p>
            </div>
        </div>
        <div class="listening-item">
            <h4>처방약 정보</h4>
            <div class="listening-content">
                <p class="doctor-script">처방약의 이름과 복용 방법을 설명드리겠습니다.</p>
            </div>
        </div>
    `;
    
    precautionsContent.innerHTML = `
        <div class="precautions-item">
            <h4>의사소통 주의사항</h4>
            <p>의사의 설명이 이해되지 않으면 반드시 다시 물어보세요.</p>
        </div>
        <div class="precautions-item">
            <h4>약물 복용 주의사항</h4>
            <p>약을 복용하기 전에 부작용을 꼭 확인하세요.</p>
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

// 이미지로 다운로드
async function downloadAsImage() {
    try {
        showNotification('이미지 생성 중입니다...', 'info');
        
        const cheatsheetContainer = document.getElementById('cheatsheetContainer');
        
        // 스크롤 위치 저장
        const originalScrollTop = window.scrollY;
        
        // 컨테이너를 화면 상단으로 스크롤
        cheatsheetContainer.scrollIntoView({ behavior: 'instant' });
        
        // 잠시 대기하여 스크롤 완료
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // html2canvas 옵션 설정
        const options = {
            scale: 2, // 고해상도
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: cheatsheetContainer.offsetWidth,
            height: cheatsheetContainer.offsetHeight,
            scrollX: 0,
            scrollY: 0
        };
        
        // 이미지 생성
        const canvas = await html2canvas(cheatsheetContainer, options);
        
        // 이미지를 blob으로 변환
        canvas.toBlob((blob) => {
            // 다운로드 링크 생성
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // 파일명 생성 (현재 날짜 포함)
            const now = new Date();
            const dateStr = now.getFullYear() + 
                           String(now.getMonth() + 1).padStart(2, '0') + 
                           String(now.getDate()).padStart(2, '0') + '_' +
                           String(now.getHours()).padStart(2, '0') + 
                           String(now.getMinutes()).padStart(2, '0');
            
            link.download = `진료스크립트_${dateStr}.png`;
            
            // 다운로드 실행
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 메모리 정리
            URL.revokeObjectURL(url);
            
            // 원래 스크롤 위치로 복원
            window.scrollTo(0, originalScrollTop);
            
            showNotification('이미지가 성공적으로 다운로드되었습니다.', 'success');
        }, 'image/png');
        
    } catch (error) {
        console.error('이미지 다운로드 오류:', error);
        showNotification('이미지 다운로드 중 오류가 발생했습니다.', 'error');
    }
}

// 텍스트로 다운로드
function downloadAsText() {
    try {
        const cheatsheetContainer = document.getElementById('cheatsheetContainer');
        
        // 구조화된 텍스트 생성
        let textContent = '📋 진료 스크립트\n';
        textContent += '='.repeat(50) + '\n\n';
        
        // 심리적 섹션
        const psychologicalSection = cheatsheetContainer.querySelector('.psychological-section');
        if (psychologicalSection) {
            textContent += '💙 마음의 준비\n';
            textContent += '-'.repeat(30) + '\n';
            
            const encouragementCard = psychologicalSection.querySelector('.encouragement-card');
            if (encouragementCard) {
                const title = encouragementCard.querySelector('h4');
                const content = encouragementCard.querySelector('p');
                if (title) textContent += title.textContent + '\n';
                if (content) textContent += content.textContent + '\n\n';
            }
            
            const researchInfo = psychologicalSection.querySelector('.research-info');
            if (researchInfo) {
                const title = researchInfo.querySelector('h4');
                const content = researchInfo.querySelector('p');
                if (title) textContent += title.textContent + '\n';
                if (content) textContent += content.textContent + '\n\n';
            }
            
            const voiceAnalysis = psychologicalSection.querySelector('.voice-analysis');
            if (voiceAnalysis) {
                const analysisContent = voiceAnalysis.querySelector('.analysis-content');
                if (analysisContent) {
                    textContent += '🎤 음성 분석 결과\n';
                    textContent += analysisContent.textContent + '\n\n';
                }
            }
        }
        
        // 스크립트 섹션
        const scriptSection = cheatsheetContainer.querySelector('.script-section');
        if (scriptSection) {
            textContent += '💬 실제 말할 스크립트\n';
            textContent += '-'.repeat(30) + '\n';
            
            const scriptItems = scriptSection.querySelectorAll('.script-item');
            scriptItems.forEach((item, index) => {
                const title = item.querySelector('h4');
                const actualScript = item.querySelector('.actual-script');
                
                if (title) textContent += `${index + 1}. ${title.textContent}\n`;
                if (actualScript) textContent += `   ${actualScript.textContent}\n`;
                textContent += '\n';
            });
        }
        
        // 들어야 하는 것 섹션
        const listeningSection = cheatsheetContainer.querySelectorAll('.script-section')[1];
        if (listeningSection) {
            textContent += '👂 무조건 들어야 하는 것\n';
            textContent += '-'.repeat(30) + '\n';
            
            const listeningItems = listeningSection.querySelectorAll('.listening-item');
            listeningItems.forEach((item, index) => {
                const title = item.querySelector('h4');
                const doctorScript = item.querySelector('.doctor-script');
                
                if (title) textContent += `${index + 1}. ${title.textContent}\n`;
                if (doctorScript) textContent += `   ${doctorScript.textContent}\n`;
                textContent += '\n';
            });
        }
        
        // 주의사항 섹션
        const precautionsSection = cheatsheetContainer.querySelectorAll('.script-section')[2];
        if (precautionsSection) {
            textContent += '⚠️ 주의사항\n';
            textContent += '-'.repeat(30) + '\n';
            
            const precautionsItems = precautionsSection.querySelectorAll('.precautions-item');
            precautionsItems.forEach((item, index) => {
                const title = item.querySelector('h4');
                const content = item.querySelector('p');
                
                if (title) textContent += `${index + 1}. ${title.textContent}\n`;
                if (content) textContent += `   ${content.textContent}\n`;
                textContent += '\n';
            });
        }
        
        // 파일명 생성
        const now = new Date();
        const dateStr = now.getFullYear() + 
                       String(now.getMonth() + 1).padStart(2, '0') + 
                       String(now.getDate()).padStart(2, '0') + '_' +
                       String(now.getHours()).padStart(2, '0') + 
                       String(now.getMinutes()).padStart(2, '0');
        
        // 다운로드 실행
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `진료스크립트_${dateStr}.txt`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 메모리 정리
        URL.revokeObjectURL(url);
        
        showNotification('텍스트 파일이 성공적으로 다운로드되었습니다.', 'success');
        
    } catch (error) {
        console.error('텍스트 다운로드 오류:', error);
        showNotification('텍스트 다운로드 중 오류가 발생했습니다.', 'error');
    }
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