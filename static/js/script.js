document.addEventListener("DOMContentLoaded", function () {
    // === 1. Анимации появления/исчезновения для fade-in-* элементов ===
    const elements = document.querySelectorAll(
        ".fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right"
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;

            // Определяем тип анимации
            let animationType = '';
            if (el.classList.contains('fade-in-up')) animationType = 'fade-in-up';
            else if (el.classList.contains('fade-in-down')) animationType = 'fade-in-down';
            else if (el.classList.contains('fade-in-left')) animationType = 'fade-in-left';
            else if (el.classList.contains('fade-in-right')) animationType = 'fade-in-right';

            if (!animationType) return;

            if (entry.isIntersecting) {
                // Перезапускаем анимацию
                el.classList.remove(`${animationType}-active`);
                requestAnimationFrame(() => {
                    el.classList.add(`${animationType}-active`);
                });
            } else {
                // Убираем анимацию, когда элемент вне зоны видимости
                el.classList.remove(`${animationType}-active`);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px"
    });

    elements.forEach(el => observer.observe(el));


    // === 2. Анимация шапки: показывается если scrollY <= 600, скрывается если scrollY > 600 ===
    const header = document.querySelector('header');

    if (header) { // Проверяем, существует ли header
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;

            if (scrollTop > 300) {
                // Скрываем шапку
                header.classList.add('hidden');
            } else {
                // Показываем шапку
                header.classList.remove('hidden');
            }
        });
    }


    // === 3. Логика отзывов — загрузка и слайдер ===
    async function loadReviews() {
        try {
            const res = await fetch('/get-reviews');
            const reviews = await res.json();
            const container = document.getElementById('reviews-container');
            if (!container) return; // Защита от отсутствия контейнера
            container.innerHTML = '';

            reviews.forEach((review, index) => {
                const div = document.createElement('div');
                div.className = 'review-item';
                if (index === 0) div.classList.add('active');

                // Звезды
                const stars = document.createElement('div');
                stars.className = 'stars';
                for (let i = 0; i < 5; i++) {
                    const img = document.createElement('img');
                    img.src = i < review.rating
                        ? "/static/img/application-review/star-filled.png"
                        : "/static/img/application-review/star-empty.png";
                    img.alt = "звезда";
                    img.className = "star-img";
                    stars.appendChild(img);
                }

                // Текст отзыва
                const text = document.createElement('p');
                text.className = 'review-text';
                text.textContent = review.comment;

                // Автор
                const author = document.createElement('div');
                author.className = 'review-author';
                const avatar = document.createElement('img');
                avatar.src = "/static/img/application-review/avatar.png";
                avatar.alt = "Автор";
                avatar.className = "avatar";
                const span = document.createElement('span');
                span.textContent = review.name;
                author.appendChild(avatar);
                author.appendChild(span);

                // Сборка
                div.appendChild(stars);
                div.appendChild(text);
                div.appendChild(author);
                container.appendChild(div);
            });

            startCarousel(); // запуск слайдера
        } catch (err) {
            console.error("Ошибка загрузки отзывов:", err);
        }
    }

    function startCarousel() {
        const reviews = document.querySelectorAll('.review-item');
        if (reviews.length <= 1) return; // Не нужен слайдер, если 1 или меньше отзывов

        let index = 0;

        setInterval(() => {
            reviews[index].classList.remove('active');
            index = (index + 1) % reviews.length;
            reviews[index].classList.add('active');
        }, 6000);
    }

    // Отправка отзыва
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('reviewName').value.trim();
            const comment = document.getElementById('reviewComment').value.trim();
            const rating = document.querySelector('input[name="rating"]:checked');

            if (!rating) {
                alert("Выберите оценку");
                return;
            }

            const response = await fetch('/submit-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    reviewName: name,
                    reviewComment: comment,
                    rating: rating.value
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                this.reset();
                loadReviews(); // обновляем список отзывов
            } else {
                alert("Ошибка при сохранении отзыва");
            }
        });
    }

    // Запуск загрузки отзывов
    loadReviews();
});