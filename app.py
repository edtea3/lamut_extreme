from flask import Flask, request, render_template, redirect, url_for, flash, get_flashed_messages
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # обязательно!

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

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

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/send', methods=['POST'])
def send_data():
    name = request.form.get('name')
    phone = request.form.get('phone')
    question = request.form.get('question')

    message_text = f"Имя: {name}\nТелефон: {phone}\nВопрос: {question}"

    try:
        send_email("Новый вопрос с сайта", message_text)
        flash("success")  # помещаем сообщение
    except Exception as e:
        flash("error")

    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)