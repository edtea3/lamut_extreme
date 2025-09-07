from flask import Flask, request, render_template, jsonify
from dotenv import load_dotenv
import os
from supabase import create_client
from email.message import EmailMessage
import smtplib
import secrets
from flask_wtf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)

csrf = CSRFProtect(app)

load_dotenv()

# Инициализация лимитера
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],  # дефолтные ограничения
    app=app
)

app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Настройки почты
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Подключение к Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("WARNING: Supabase credentials not configured")

# === Функции ===
def send_email(subject, text):
    msg = EmailMessage()
    msg.set_content(text)
    msg['Subject'] = subject
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = EMAIL_ADDRESS

    if EMAIL_ADDRESS and EMAIL_PASSWORD:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
    else:
        print("WARNING: Email credentials not configured")
    print("Письмо отправлено")


# --- Роуты ---
@app.route('/')
def home():
    return render_template('index.html')


# --- Обработка вопроса ---
@app.route('/send', methods=['POST'])
@limiter.limit("3 per minute")  # максимум 3 заявки с одного IP в минуту
def send_data():
    if request.form.get('hp-field'):
        return jsonify({'status': 'error', 'message': 'Spam detected'}), 400

    name = request.form.get('name')
    phone = request.form.get('phone')
    question = request.form.get('question')

    message_text = f"Имя: {name}\nТелефон: {phone}\nВопрос: {question}"

    try:
        send_email("Новый вопрос с сайта", message_text)
        return jsonify({'status': 'success'})
    except Exception as e:
        print(e)
        return jsonify({'status': 'error'}), 500


# --- Обработка отзыва ---
@app.route('/submit-review', methods=['POST'])
@limiter.limit("3 per minute")  # максимум 3 отзыва с одного IP в минуту
def submit_review():
    # Honeypot проверка
    if request.form.get('hp-field'):
        return jsonify({'status': 'error', 'message': 'Spam detected'}), 400

    print("DEBUG: Headers:", request.headers)
    print("DEBUG: Form Data:", request.form)
    print("DEBUG: Raw Data:", request.data)

    name = request.form.get('reviewName')
    comment = request.form.get('reviewComment')
    rating = request.form.get('rating')

    print("DEBUG:", name, comment, rating)

    if not all([name, comment, rating]):
        return jsonify({'status': 'error', 'message': 'Все поля обязательны'}), 400

    new_review = {
        'name': name,
        'comment': comment,
        'rating': int(rating)
    }

    if not supabase:
        return jsonify({'status': 'error', 'message': 'База данных не настроена'}), 500

    try:
        response = supabase.table("reviews").insert(new_review).execute()
        print("DEBUG: Вставка ответа:", response)

        if not response.data:
            return jsonify({'status': 'error', 'message': 'Ошибка при добавлении отзыва'}), 500

        return jsonify({'status': 'success', 'data': response.data[0]})

    except Exception as e:
        print("Ошибка при обработке отзыва:", e)
        return jsonify({'status': 'error', 'message': 'Ошибка при обработке отзыва'}), 500


# --- Получение отзывов ---
@app.route('/get-reviews')
def get_reviews():
    if not supabase:
        return jsonify([])  # Return empty array if database not configured
    
    try:
        response = supabase.table("reviews").select("*").order("created_at", desc=True).execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Ошибка при получении отзывов: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)