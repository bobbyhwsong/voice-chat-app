from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import openai
import os
import logging
import json
import requests
import re
from datetime import datetime

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # CORS 활성화

# API 키 설정
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
openai.api_key = OPENAI_API_KEY

# ElevenLabs API 키 (환경변수에서 가져오거나 직접 설정)
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
if not ELEVENLABS_API_KEY:
    raise ValueError("ELEVENLABS_API_KEY 환경변수가 설정되지 않았습니다.")
ELEVENLABS_VOICE_ID = "BNr4zvrC1bGIdIstzjFQ" # Harry Kim

# 대화 기록을 저장할 리스트
conversation_history = []

# 로그 파일 경로
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

def create_user_directory(participant_id):
    """사용자별 디렉토리 생성"""
    user_dir = os.path.join(LOG_DIR, participant_id)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
    return user_dir

def clean_json_response(response_text):
    """LLM 응답에서 JSON 부분만 추출"""
    # 코드 블록 제거
    cleaned = response_text.strip()
    
    # ```json ... ``` 패턴 찾기
    json_match = re.search(r'```json\s*(.*?)\s*```', cleaned, re.DOTALL)
    if json_match:
        return json_match.group(1).strip()
    
    # ``` ... ``` 패턴 찾기
    code_match = re.search(r'```\s*(.*?)\s*```', cleaned, re.DOTALL)
    if code_match:
        return code_match.group(1).strip()
    
    # JSON 객체 패턴 찾기
    json_obj_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if json_obj_match:
        return json_obj_match.group(0).strip()
    
    return cleaned

def generate_elevenlabs_audio(text):
    """ElevenLabs API를 사용하여 음성 생성"""
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # 오디오 파일로 저장 (사용자별 폴더에 저장)
            audio_filename = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3"
            audio_filepath = os.path.join(LOG_DIR, audio_filename)
            
            with open(audio_filepath, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"음성 파일 생성됨: {audio_filepath}")
            return audio_filepath
        else:
            logger.error(f"ElevenLabs API 오류: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"음성 생성 오류: {str(e)}")
        return None

def save_conversation_log(user_message, bot_response, participant_id=None):
    """대화 로그를 파일에 저장"""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    
    # 참여자 ID가 있으면 사용자별 폴더에 저장
    if participant_id:
        user_dir = create_user_directory(participant_id)
        log_filename = f"medical_conversation_{datetime.now().strftime('%Y%m%d')}.json"
        log_filepath = os.path.join(user_dir, log_filename)
    else:
        log_filename = f"medical_conversation_unknown_{datetime.now().strftime('%Y%m%d')}.json"
        log_filepath = os.path.join(LOG_DIR, log_filename)
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "user_message": user_message,
        "bot_response": bot_response,
        "session_id": timestamp,
        "participant_id": participant_id
    }
    
    try:
        # 기존 로그 파일이 있으면 읽어서 추가
        if os.path.exists(log_filepath):
            with open(log_filepath, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        else:
            logs = []
        
        logs.append(log_entry)
        
        # 로그 파일에 저장
        with open(log_filepath, 'w', encoding='utf-8') as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)
            
        logger.info(f"대화 로그 저장됨: {log_filepath}")
        
    except Exception as e:
        logger.error(f"로그 저장 오류: {str(e)}")

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        participant_id = data.get('participant_id', None)
        
        if not user_message:
            return jsonify({'error': '메시지가 없습니다.'}), 400
        
        logger.info(f"사용자 메시지: {user_message} (참여자: {participant_id})")
        
        # 대화 기록에 사용자 메시지 추가
        conversation_history.append({"role": "user", "content": user_message})
        
        # OpenAI API 호출
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """당신은 50대 후반의 경험 많은 내과 의사입니다. 

성격 특징:
- 다소 까칠하고 직설적인 성격
- 환자와 친근하면서도 전문적인 태도
- 불필요한 공손함보다는 솔직한 소통 선호
- "그래", "음", "흠" 같은 짧은 반응을 자주 사용
- 나이 많은 의사다운 경험과 지혜를 바탕으로 한 진료

진료 스타일:
- 핵심적인 진료 질문과 답변
- 불필요한 자세한 설명보다는 핵심만 전달
- 때로는 짧은 한마디로 끝내기도 함
- 의료 전문 용어를 적절히 사용
- 진료 상황에 맞는 적절한 톤과 어조

진료 시나리오:
- 증상 문진, 진찰, 진단, 처방 등 의료 과정 진행
- 환자의 증상을 정확히 파악하고 적절한 진료 제공
- 필요시 추가 검사나 상담을 권유
- 한국어로 진료하되 자연스럽게"""},
                    *conversation_history
                ],
                max_tokens=300,
                temperature=0.8
            )
            
            bot_response = response.choices[0].message.content
            logger.info(f"봇 응답: {bot_response}")
            
            # 대화 로그 저장
            save_conversation_log(user_message, bot_response, participant_id)
            
            # 대화 기록에 봇 응답 추가
            conversation_history.append({"role": "assistant", "content": bot_response})
            
            # 대화 기록이 너무 길어지면 오래된 메시지 제거
            if len(conversation_history) > 10:
                conversation_history.pop(0)
                conversation_history.pop(0)
            
            return jsonify({
                'response': bot_response,
                'status': 'success'
            })
            
        except Exception as e:
            logger.error(f"OpenAI API 오류: {str(e)}")
            return jsonify({
                'response': '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                'status': 'error'
            }), 500
            
    except Exception as e:
        logger.error(f"서버 오류: {str(e)}")
        return jsonify({'error': '서버 오류가 발생했습니다.'}), 500

@app.route('/api/clear', methods=['POST'])
def clear_conversation():
    """대화 기록 초기화"""
    global conversation_history
    conversation_history = []
    return jsonify({'status': 'success', 'message': '대화 기록이 초기화되었습니다.'})

@app.route('/api/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({'status': 'healthy', 'message': '서버가 정상적으로 작동 중입니다.'})

@app.route('/api/save-user-data', methods=['POST'])
def save_user_data():
    """사용자 정보와 증상 데이터 저장"""
    try:
        data = request.get_json()
        participant_id = data.get('participantId')
        symptoms = data.get('symptoms')
        consent = data.get('consent')
        login_time = data.get('loginTime')
        
        if not participant_id or not symptoms or not consent:
            return jsonify({"status": "error", "message": "필수 정보가 누락되었습니다."}), 400
        
        # 사용자별 디렉토리 생성
        user_dir = create_user_directory(participant_id)
        
        # 사용자 정보 저장
        user_data = {
            "participant_id": participant_id,
            "symptoms": symptoms,
            "consent": consent,
            "login_time": login_time,
            "created_at": datetime.now().isoformat()
        }
        
        user_info_file = os.path.join(user_dir, "user_info.json")
        with open(user_info_file, 'w', encoding='utf-8') as f:
            json.dump(user_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"사용자 정보 저장됨: {user_info_file}")
        
        return jsonify({"status": "success", "message": "사용자 정보가 저장되었습니다."})
        
    except Exception as e:
        logger.error(f"사용자 정보 저장 오류: {str(e)}")
        return jsonify({"status": "error", "message": "서버 오류가 발생했습니다."}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """대화 로그 조회"""
    try:
        date = request.args.get('date', datetime.now().strftime('%Y%m%d'))
        participant_id = request.args.get('participant_id', None)
        
        if participant_id:
            user_dir = create_user_directory(participant_id)
            log_filename = f"medical_conversation_{date}.json"
            log_filepath = os.path.join(user_dir, log_filename)
        else:
            log_filename = f"medical_conversation_unknown_{date}.json"
            log_filepath = os.path.join(LOG_DIR, log_filename)
        
        if os.path.exists(log_filepath):
            with open(log_filepath, 'r', encoding='utf-8') as f:
                logs = json.load(f)
            return jsonify({
                'status': 'success',
                'logs': logs,
                'date': date,
                'participant_id': participant_id
            })
        else:
            return jsonify({
                'status': 'success',
                'logs': [],
                'date': date,
                'participant_id': participant_id,
                'message': '해당 참여자의 로그가 없습니다.'
            })
            
    except Exception as e:
        logger.error(f"로그 조회 오류: {str(e)}")
        return jsonify({'error': '로그 조회 중 오류가 발생했습니다.'}), 500

def convert_grade_to_score(grade):
    """상/중/하를 점수로 변환"""
    if grade == "상":
        return 95  # 90-100점 범위의 중간값
    elif grade == "중":
        return 75  # 60-89점 범위의 중간값
    elif grade == "하":
        return 30  # 0-59점 범위의 중간값
    else:
        return 50  # 기본값

def calculate_overall_score(scores):
    """전체 점수 계산 (기존 방식)"""
    total_score = 0
    for grade in scores.values():
        total_score += convert_grade_to_score(grade)
    return round(total_score / len(scores))

def calculate_overall_score_from_grades(grades):
    """상/중/하 개수 기반 전체 점수 계산"""
    if not grades:
        return 0
    
    grade_counts = {'상': 0, '중': 0, '하': 0}
    
    for grade in grades.values():
        if grade in grade_counts:
            grade_counts[grade] += 1
    
    total_items = sum(grade_counts.values())
    if total_items == 0:
        return 0
    
    # 상: 100점, 중: 60점, 하: 30점으로 계산
    total_score = (grade_counts['상'] * 100) + (grade_counts['중'] * 60) + (grade_counts['하'] * 30)
    return round(total_score / total_items)

@app.route('/api/evaluate', methods=['POST'])
def evaluate_conversation():
    """LLM을 사용한 대화 평가"""
    try:
        data = request.get_json()
        logs = data.get('logs', [])
        participant_id = data.get('participant_id', None)
        evaluation_type = data.get('evaluation_type', 'conversation_based')
        
        if not logs:
            return jsonify({'error': '평가할 대화 로그가 없습니다.'}), 400
        
        # 대화 내용을 하나의 텍스트로 결합
        conversation_text = ""
        for log in logs:
            conversation_text += f"환자: {log['user_message']}\n"
            conversation_text += f"의사: {log['bot_response']}\n\n"
        
        # LLM 평가 프롬프트 (구체적인 대화로그 기반 평가)
        evaluation_prompt = f"""<Instruction> 너는 환자의 대화 내용 평가 챗봇이야. Conversation Text 중 환자가 한 말을 Evaluation Criteria를 기준으로 Evaluation Score를 매겨줘.

<Conversation Text>
{conversation_text}
</Conversation Text>

<Evaluation Criteria>
1. 환자 입장에서 꼭 말해야 하는 것
   - 어디가 아픈지 구체적인 위치 = "symptom_location"
   - 언제부터 아픈지 시작 시기 = "symptom_timing"
   - 증상이 얼마나 심한지 강도 = "symptom_severity"
   - 현재 복용 중인 약물 = "current_medication"
   - 알레르기 여부 = "allergy_info"

2. 진료과정 중에 꼭 들어야 하는 것
   - 의사의 진단명과 진단 근거 = "diagnosis_info"
   - 처방약의 이름과 복용 방법 = "prescription_info"
   - 약의 부작용과 주의사항 = "side_effects"
   - 다음 진료 계획과 재방문 시기 = "followup_plan"
   - 증상 악화 시 언제 다시 와야 하는지 = "emergency_plan"

추가 중요한 평가 원칙:
1. 구체적인 대화로그를 기반으로 평가하세요
2. 해당 정보가 대화에서 실제로 언급되지 않으면 무조건 '하'로 평가하세요
3. 각 항목의 모두 이유를 작성하세요. 이유는 반드시 대화 내용을 인용하여 구체적으로 작성하세요
4. improvement_tips는 '하' 등급을 받은 항목에 대해서만 환자가 해야하는 역할을 생성하세요

</Evaluation Criteria>

<Evaluation Score>
- 상: 가이드라인을 완벽하게 준수, 구체적이고 상세한 정보 제공
- 중: 가이드라인을 대부분 준수, 대부분의 정보를 적절히 제공
- 하: 가이드라인을 거의 준수하지 않음, 정보가 부족하거나 불구체적
</Evaluation Score>

<Example>
{{
    "grades": {{
        "symptom_location": "상",
        "symptom_timing": "중",
        "symptom_severity": "하",
        "current_medication": "상",
        "allergy_info": "중",
        "diagnosis_info": "상",
        "prescription_info": "중",
        "side_effects": "하",
        "followup_plan": "중",
        "emergency_plan": "중"
    }},
    "score_reasons": {{
        "symptom_location": "환자가 '머리 뒤쪽이 아파요'라고 구체적인 위치를 언급했습니다.",
        "symptom_timing": "환자가 '어제부터'라고 시작 시기를 언급했지만 더 구체적인 시간이 필요합니다.",
        "symptom_severity": "증상의 강도에 대한 언급이 대화에서 확인되지 않습니다.",
        "current_medication": "환자가 현재 복용 중인 약물을 구체적으로 언급했습니다.",
        "allergy_info": "알레르기 정보가 언급되었습니다.",
        "diagnosis_info": "의사가 진단명과 근거를 설명했습니다.",
        "prescription_info": "처방약 정보가 부분적으로 언급되었습니다.",
        "side_effects": "약의 부작용에 대한 언급이 대화에서 확인되지 않습니다.",
        "followup_plan": "다음 진료 계획이 언급되었습니다.",
        "emergency_plan": "증상 악화 시 대응 방안이 언급되었습니다."
    }},
    "improvement_tips": [
        "증상의 강도를 구체적으로 설명해보세요 (예: 10점 만점에 7점 정도).",
        "약의 부작용과 주의사항을 더 자세히 듣고 기록해보세요.",
        "알레르기 정보를 더 구체적으로 제공해보세요."
    ]
}}
</Example>

"""
        
        # LLM 호출
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 의료 진료 대화 평가 전문가입니다. 환자의 진료 대화 능력을 객관적이고 정확하게 평가해주세요."},
                {"role": "user", "content": evaluation_prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        evaluation_result = response.choices[0].message.content
        
        try:
            # JSON 파싱 - 코드 블록 제거
            cleaned_result = clean_json_response(evaluation_result)
            evaluation_data = json.loads(cleaned_result)
            
            # grades를 scores로 변환 (하위 호환성을 위해)
            if 'grades' in evaluation_data:
                evaluation_data['scores'] = evaluation_data['grades']
            
            # 상/중/하를 점수로 변환 (하위 호환성을 위해)
            converted_scores = {}
            for key, grade in evaluation_data['scores'].items():
                converted_scores[key] = convert_grade_to_score(grade)
            
            # 전체 점수 계산 (상/중/하 개수 기반)
            overall_score = calculate_overall_score_from_grades(evaluation_data['scores'])
            
            # 변환된 점수와 원본 등급을 모두 포함
            evaluation_data['converted_scores'] = converted_scores
            evaluation_data['overall_score'] = overall_score
            
            logger.info(f"대화 평가 완료: {participant_id}")
            
            # 평가 결과를 사용자별 폴더에 저장
            if participant_id:
                user_dir = create_user_directory(participant_id)
                feedback_filename = f"feedback_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                feedback_filepath = os.path.join(user_dir, feedback_filename)
                
                feedback_data = {
                    "participant_id": participant_id,
                    "evaluation_date": datetime.now().isoformat(),
                    "conversation_logs": logs,
                    "evaluation_result": evaluation_data
                }
                
                with open(feedback_filepath, 'w', encoding='utf-8') as f:
                    json.dump(feedback_data, f, ensure_ascii=False, indent=2)
                
                logger.info(f"피드백 데이터 저장됨: {feedback_filepath}")
            
            return jsonify({
                'status': 'success',
                'evaluation': evaluation_data
            })
        except json.JSONDecodeError:
            logger.error(f"LLM 응답 JSON 파싱 오류: {evaluation_result}")
            return jsonify({'error': '평가 결과 파싱 중 오류가 발생했습니다.'}), 500
            
    except Exception as e:
        logger.error(f"평가 요청 오류: {str(e)}")
        return jsonify({'error': '평가 중 오류가 발생했습니다.'}), 500

@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    """피드백 데이터 조회"""
    try:
        participant_id = request.args.get('participant_id', None)
        date = request.args.get('date', datetime.now().strftime('%Y%m%d'))
        
        if not participant_id:
            return jsonify({'error': '참여자 ID가 필요합니다.'}), 400
        
        user_dir = create_user_directory(participant_id)
        feedback_files = []
        
        # 사용자 폴더에서 피드백 파일들 찾기
        if os.path.exists(user_dir):
            for filename in os.listdir(user_dir):
                if filename.startswith('feedback_') and filename.endswith('.json'):
                    feedback_files.append(filename)
        
        # 날짜별로 필터링
        filtered_files = []
        for filename in feedback_files:
            if date in filename:
                filtered_files.append(filename)
        
        feedback_data = []
        for filename in filtered_files:
            filepath = os.path.join(user_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    feedback_data.append(data)
            except Exception as e:
                logger.error(f"피드백 파일 읽기 오류: {filepath}, {str(e)}")
        
        return jsonify({
            'status': 'success',
            'feedback_data': feedback_data,
            'participant_id': participant_id,
            'date': date
        })
        
    except Exception as e:
        logger.error(f"피드백 조회 오류: {str(e)}")
        return jsonify({'error': '피드백 조회 중 오류가 발생했습니다.'}), 500

@app.route('/api/generate-cheatsheet', methods=['POST'])
def generate_cheatsheet():
    """LLM을 사용한 맞춤형 치트시트 생성"""
    try:
        data = request.get_json()
        participant_id = data.get('participant_id', None)
        
        if not participant_id:
            return jsonify({'error': '참여자 ID가 필요합니다.'}), 400
        
        # 사용자 정보 가져오기
        user_dir = create_user_directory(participant_id)
        user_info_file = os.path.join(user_dir, "user_info.json")
        
        user_info = {}
        if os.path.exists(user_info_file):
            with open(user_info_file, 'r', encoding='utf-8') as f:
                user_info = json.load(f)
        
        # 대화 로그 가져오기
        conversation_logs = []
        log_files = [f for f in os.listdir(user_dir) if f.startswith('medical_conversation_') and f.endswith('.json')]
        if log_files:
            latest_log_file = sorted(log_files)[-1]
            log_filepath = os.path.join(user_dir, latest_log_file)
            with open(log_filepath, 'r', encoding='utf-8') as f:
                conversation_logs = json.load(f)
        
        # 피드백 데이터 가져오기
        feedback_data = {}
        feedback_files = [f for f in os.listdir(user_dir) if f.startswith('feedback_') and f.endswith('.json')]
        if feedback_files:
            latest_feedback_file = sorted(feedback_files)[-1]
            feedback_filepath = os.path.join(user_dir, latest_feedback_file)
            with open(feedback_filepath, 'r', encoding='utf-8') as f:
                feedback_data = json.load(f)
        
        # 대화 내용을 텍스트로 변환
        conversation_text = ""
        for log in conversation_logs:
            conversation_text += f"환자: {log['user_message']}\n"
            conversation_text += f"의사: {log['bot_response']}\n\n"
        
        # LLM 스크립트 생성 프롬프트
        cheatsheet_prompt = f"""다음은 의료 진료 연습 대화와 피드백 데이터입니다. 
실제 진료 중에 바로 보고 말할 수 있는 스크립트를 생성해주세요.

사용자 정보:
- 참여자 ID: {participant_id}
- 초기 증상: {user_info.get('symptoms', '정보 없음')}

대화 내용:
{conversation_text}

피드백 평가:
{json.dumps(feedback_data.get('evaluation_result', {}), ensure_ascii=False, indent=2)}

다음 JSON 형식으로 응답해주세요:
{{
    "cheatsheet": {{
        "title": "진료 스크립트",
        "patient_info": {{
            "participant_id": "{participant_id}",
            "initial_symptoms": "{user_info.get('symptoms', '정보 없음')}",
            "generated_date": "{datetime.now().strftime('%Y년 %m월 %d일')}"
        }},
        "script": [
            {{
                "title": "증상 설명",
                "content": "의사에게 처음 말할 증상 설명 스크립트",
                "example": "어제부터 머리 뒤쪽이 지속적으로 아파요"
            }},
            {{
                "title": "과거 병력",
                "content": "의사가 물어볼 과거 병력에 대한 답변 스크립트",
                "example": "알레르기는 없고, 만성질환도 없습니다"
            }}
        ],
        "questions": [
            {{
                "question": "증상이 언제부터 시작되었나요?",
                "answer": "구체적인 답변 예시"
            }},
            {{
                "question": "어떤 상황에서 증상이 심해지나요?",
                "answer": "상황별 답변 예시"
            }},
            {{
                "question": "복용 중인 약이 있나요?",
                "answer": "약물 정보 답변 예시"
            }}
        ],
        "listening": [
            "진찰 결과",
            "진단명과 근거",
            "처방약 정보",
            "복용법과 주의사항"
        ],
        "my_questions": [
            "이 약의 부작용은 무엇인가요?",
            "언제까지 복용해야 하나요?",
            "증상이 악화되면 어떻게 해야 하나요?",
            "다음 진료는 언제 받아야 하나요?"
        ],
        "precautions": [
            "의사의 설명이 이해되지 않으면 반드시 다시 물어보세요",
            "약을 복용하기 전에 부작용을 꼭 확인하세요",
            "증상이 예상과 다르게 변화하면 즉시 병원에 연락하세요",
            "다음 진료 일정을 정확히 확인하고 기록하세요"
        ]
    }}
}}

스크립트 생성 시 주의사항:
- 실제 진료 중에 바로 보고 말할 수 있는 간단하고 명확한 표현 사용
- 피드백에서 지적된 개선점들을 반영
- 구체적이고 실용적인 정보 포함
- 각 섹션별로 구분하여 쉽게 찾을 수 있도록 구성
- 실제 말할 수 있는 자연스러운 표현 사용"""
        
        # LLM 호출
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "당신은 의료 진료 치트시트 생성 전문가입니다. 실제 진료에서 환자가 사용할 수 있는 실용적이고 자연스러운 치트시트를 생성해주세요."},
                {"role": "user", "content": cheatsheet_prompt}
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        cheatsheet_result = response.choices[0].message.content
        
        try:
            # JSON 파싱 - 코드 블록 제거
            cleaned_result = clean_json_response(cheatsheet_result)
            cheatsheet_data = json.loads(cleaned_result)
            
            # 치트시트 데이터를 사용자별 폴더에 저장
            cheatsheet_filename = f"cheatsheet_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            cheatsheet_filepath = os.path.join(user_dir, cheatsheet_filename)
            
            with open(cheatsheet_filepath, 'w', encoding='utf-8') as f:
                json.dump(cheatsheet_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"치트시트 데이터 저장됨: {cheatsheet_filepath}")
            
            return jsonify({
                'status': 'success',
                'cheatsheet': cheatsheet_data
            })
            
        except json.JSONDecodeError:
            logger.error(f"LLM 응답 JSON 파싱 오류: {cheatsheet_result}")
            return jsonify({'error': '치트시트 생성 중 오류가 발생했습니다.'}), 500
            
    except Exception as e:
        logger.error(f"치트시트 생성 오류: {str(e)}")
        return jsonify({'error': '치트시트 생성 중 오류가 발생했습니다.'}), 500

@app.route('/api/analyze-quest', methods=['POST'])
def analyze_quest():
    """퀘스트 완료 여부를 LLM으로 분석"""
    try:
        data = request.get_json()
        user_message = data.get('user_message', '')
        bot_response = data.get('bot_response', '')
        active_quests = data.get('active_quests', [])
        participant_id = data.get('participant_id')
        
        if not active_quests:
            return jsonify({
                'status': 'success',
                'completed_quests': []
            })
        
        # LLM에게 퀘스트 분석 요청
        quest_analysis_prompt = f"""
당신은 의료 진료 대화에서 환자의 응답을 분석하여 특정 퀘스트의 완료 여부를 판단하는 전문가입니다.

현재 대화:
환자: {user_message}
의사: {bot_response}

진행 중인 퀘스트들:
{json.dumps(active_quests, ensure_ascii=False, indent=2)}

각 퀘스트에 대해 다음 기준으로 완료 여부를 판단해주세요:

1. **증상 설명 퀘스트**: 환자가 증상의 위치, 시작 시기, 강도, 지속 시간을 구체적으로 언급했는지
2. **약물 정보 퀘스트**: 환자가 현재 복용 중인 약물을 언급했는지
3. **과거 병력 퀘스트**: 환자가 과거 병력이나 알레르기를 언급했는지
4. **의사소통 명확성 퀘스트**: 환자가 명확하고 이해하기 쉽게 설명했는지
5. **질문하기 퀘스트**: 환자가 의사에게 적절한 질문을 했는지
6. **후속 조치 퀘스트**: 환자가 의사의 설명에 대한 확인이나 추가 질문을 했는지

완료된 퀘스트의 ID만 JSON 배열로 응답해주세요. 완료되지 않은 퀘스트는 포함하지 마세요.

응답 형식:
```json
{{
    "completed_quests": ["quest_id1", "quest_id2"]
}}
```

분석해주세요.
"""
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "당신은 의료 진료 대화 분석 전문가입니다. 정확하고 객관적으로 퀘스트 완료 여부를 판단해주세요."},
                {"role": "user", "content": quest_analysis_prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        analysis_result = response.choices[0].message.content.strip()
        
        # JSON 응답 파싱
        try:
            # JSON 부분만 추출
            json_response = clean_json_response(analysis_result)
            result_data = json.loads(json_response)
            
            completed_quests = result_data.get('completed_quests', [])
            
            # 로그 저장
            if participant_id:
                user_dir = create_user_directory(participant_id)
                log_entry = {
                    'timestamp': datetime.now().isoformat(),
                    'type': 'quest_analysis',
                    'user_message': user_message,
                    'bot_response': bot_response,
                    'active_quests': active_quests,
                    'analysis_result': analysis_result,
                    'completed_quests': completed_quests
                }
                
                log_file = os.path.join(user_dir, f"quest_analysis_{datetime.now().strftime('%Y%m%d')}.json")
                try:
                    with open(log_file, 'a', encoding='utf-8') as f:
                        f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
                except Exception as e:
                    logger.error(f"퀘스트 분석 로그 저장 오류: {e}")
            
            return jsonify({
                'status': 'success',
                'completed_quests': completed_quests,
                'analysis_result': analysis_result
            })
            
        except json.JSONDecodeError as e:
            logger.error(f"퀘스트 분석 JSON 파싱 오류: {e}")
            logger.error(f"원본 응답: {analysis_result}")
            
            # 키워드 기반 폴백 분석
            completed_quests = []
            conversation_text = f"{user_message} {bot_response}".lower()
            
            for quest in active_quests:
                quest_id = quest['id']
                keywords = quest.get('keywords', [])
                
                if any(keyword.lower() in conversation_text for keyword in keywords):
                    completed_quests.append(quest_id)
            
            return jsonify({
                'status': 'success',
                'completed_quests': completed_quests,
                'fallback': True
            })
            
    except Exception as e:
        logger.error(f"퀘스트 분석 오류: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/tts', methods=['POST'])
def generate_tts():
    """ElevenLabs TTS API 호출"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        participant_id = data.get('participant_id', None)
        
        if not text:
            return jsonify({'error': '텍스트가 없습니다.'}), 400
        
        # 사용자별 폴더에 음성 파일 저장
        if participant_id:
            user_dir = create_user_directory(participant_id)
            audio_filename = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3"
            audio_filepath = os.path.join(user_dir, audio_filename)
        else:
            audio_filename = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3"
            audio_filepath = os.path.join(LOG_DIR, audio_filename)
        
        # ElevenLabs API 호출
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            with open(audio_filepath, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"음성 파일 생성됨: {audio_filepath}")
            return jsonify({
                'status': 'success',
                'audio_url': f'/api/audio/{os.path.basename(audio_filepath)}'
            })
        else:
            logger.error(f"ElevenLabs API 오류: {response.status_code} - {response.text}")
            return jsonify({'error': '음성 생성에 실패했습니다.'}), 500
            
    except Exception as e:
        logger.error(f"TTS API 오류: {str(e)}")
        return jsonify({'error': '음성 생성 중 오류가 발생했습니다.'}), 500

@app.route('/api/audio/<filename>')
def serve_audio(filename):
    """오디오 파일 제공"""
    try:
        # 먼저 로그 디렉토리에서 찾기
        audio_filepath = os.path.join(LOG_DIR, filename)
        
        # 로그 디렉토리에 없으면 사용자별 폴더에서 찾기
        if not os.path.exists(audio_filepath):
            # 파일명에서 사용자 ID 추출 시도 (audio_YYYYMMDD_HHMMSS.mp3 형식)
            for user_dir in os.listdir(LOG_DIR):
                user_path = os.path.join(LOG_DIR, user_dir)
                if os.path.isdir(user_path):
                    potential_path = os.path.join(user_path, filename)
                    if os.path.exists(potential_path):
                        audio_filepath = potential_path
                        break
        
        if os.path.exists(audio_filepath):
            return send_file(audio_filepath, mimetype='audio/mpeg')
        else:
            return jsonify({'error': '오디오 파일을 찾을 수 없습니다.'}), 404
    except Exception as e:
        logger.error(f"오디오 파일 제공 오류: {str(e)}")
        return jsonify({'error': '오디오 파일 제공 중 오류가 발생했습니다.'}), 500

if __name__ == '__main__':
    # API 키 확인
    if OPENAI_API_KEY == 'your-api-key-here':
        logger.warning("OpenAI API 키가 설정되지 않았습니다. 환경변수 OPENAI_API_KEY를 설정하거나 app.py에서 직접 설정하세요.")
    
    # 포트 설정 (환경변수에서 가져오거나 기본값 사용)
    port = int(os.getenv('FLASK_PORT', 5000))
    logger.info(f"서버가 포트 {port}에서 시작됩니다.")
    
    app.run(host='0.0.0.0', port=port, debug=True) 