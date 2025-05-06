from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import os
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # обязательно!
load_dotenv()

# Настройки почты
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Файл для хранения отзывов
REVIEWS_FILE = 'reviews.json'
if not os.path.exists(REVIEWS_FILE):
    with open(REVIEWS_FILE, 'w') as f:
        json.dump([], f)

# === Функции ===
def send_email(subject, text):
    msg = EmailMessage()
    msg.set_content(text)
    msg['Subject'] = subject
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = EMAIL_ADDRESS

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
    print("Письмо отправлено")


# === Роуты ===
@app.route('/')
def home():
    return render_template('index.html')


# --- Обработка вопроса ---
@app.route('/send', methods=['POST'])
def send_data():
    name = request.form.get('name')
    phone = request.form.get('phone')
    question = request.form.get('question')

    message_text = f"Имя: {name}\nТелефон: {phone}\nВопрос: {question}"

    try:
        send_email("Новый вопрос с сайта", message_text)
        flash("success")
    except Exception as e:
        print(e)
        flash("error")

    return redirect(url_for('home'))


# --- Обработка отзыва ---
@app.route('/submit-review', methods=['POST'])
def submit_review():
    name = request.form.get('reviewName')
    comment = request.form.get('reviewComment')
    rating = request.form.get('rating')

    if not all([name, comment, rating]):
        return jsonify({'status': 'error', 'message': 'Все поля обязательны'}), 400

    new_review = {
        'name': name,
        'comment': comment,
        'rating': int(rating)
    }

    with open(REVIEWS_FILE, 'r+', encoding='utf-8') as f:
        data = json.load(f)
        data.append(new_review)
        f.seek(0)
        json.dump(data, f, ensure_ascii=False, indent=4)

    return jsonify({'status': 'success'})


# --- Получение отзывов ---
@app.route('/get-reviews')
def get_reviews():
    with open(REVIEWS_FILE, 'r', encoding='utf-8') as f:
        reviews = json.load(f)
    return jsonify(reviews)


if __name__ == '__main__':
    app.run(debug=True)