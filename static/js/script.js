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

    // === 3. Отправка заявления ===
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Получаем элементы формы
            const nameInput = document.getElementById('name');
            const phoneInput = document.getElementById('phone');
            const questionInput = document.getElementById('question');

            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const question = questionInput.value.trim();

            // Сброс предыдущих ошибок
            nameInput.style.borderColor = "";
            phoneInput.style.borderColor = "";
            document.getElementById('error-name')?.remove();
            document.getElementById('error-phone')?.remove();

            let hasError = false;

            // Валидация имени
            if (!name) {
                nameInput.style.borderColor = "red";
                const error = document.createElement('div');
                error.id = 'error-name';
                error.style.color = 'red';
                nameInput.parentNode.appendChild(error);
                hasError = true;
            }

            // Валидация телефона
            if (!phone) {
                phoneInput.style.borderColor = "red";
                const error = document.createElement('div');
                error.id = 'error-phone';
                error.style.color = 'red';
                phoneInput.parentNode.appendChild(error);
                hasError = true;
            }

            // Если есть ошибки — не отправляем
            if (hasError) return;

            try {
                const response = await fetch('/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        name: name,
                        phone: phone,
                        question: question
                    })
                });

                const result = await response.json();

                if (result.status === 'success') {
                    this.reset(); // очищаем форму
                    showModal('modal'); // показываем модальное окно
                } else {
                    alert("Ошибка при отправке заявки");
                }
            } catch (error) {
                console.error(error);
                alert("Произошла ошибка при отправке заявки.");
            }
        });
    }

    // === 4. Логика отзывов — загрузка и слайдер ===
    async function loadReviews() {
        try {
            const res = await fetch('/get-reviews');

            if (!res.ok) {
                console.error("Ошибка HTTP при загрузке отзывов:", res.status);
                return;
            }

            const reviews = await res.json();

            if (!Array.isArray(reviews)) {
                console.error("Неверный формат данных: ожидается массив");
                return;
            }

            const container = document.getElementById('reviews-container');
            if (!container) return; 

            container.innerHTML = ''; 

            // Флаг для активного слайда
            let firstItem = true;

            reviews.forEach((review) => {
                // Проверка полей каждого отзыва
                if (
                    typeof review !== 'object' ||
                    !('name' in review) ||
                    !('comment' in review) ||
                    !('rating' in review)
                ) {
                    console.warn("Пропущен некорректный отзыв:", review);
                    return;
                }

                const rating = parseInt(review.rating, 10);
                if (isNaN(rating) || rating < 1 || rating > 5) {
                    console.warn("Некорректный рейтинг в отзыве:", review);
                    return;
                }

                // Создание элемента отзыва
                const div = document.createElement('div');
                div.className = 'review-item';
                if (firstItem) {
                    div.classList.add('active');
                    firstItem = false;
                }

                // Звезды
                const stars = document.createElement('div');
                stars.className = 'stars';
                for (let i = 0; i < 5; i++) {
                    const img = document.createElement('img');
                    img.src = i < rating
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
        if (reviews.length <= 1) return;

        let index = 0;

        setInterval(() => {
            reviews[index].classList.remove('active');
            index = (index + 1) % reviews.length;
            reviews[index].classList.add('active');
        }, 6000);
    }

    loadReviews(); // загрузка отзывов при старте

    // === 5. Отправка отзыва ===
    const reviewForm = document.getElementById("reviewForm");

    if (reviewForm) {
        reviewForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // предотвращаем перезагрузку страницы

            const name = document.getElementById("reviewName").value;
            const comment = document.getElementById("reviewComment").value;
            const rating = document.querySelector('input[name="rating"]:checked')?.value;

            if (!name || !comment || !rating) {
                alert("Пожалуйста, заполните все поля.");
                return;
            }

            const formData = new FormData();
            formData.append('reviewName', name);
            formData.append('reviewComment', comment);
            formData.append('rating', rating);

            try {
                const res = await fetch("/submit-review", {
                    method: "POST",
                    body: formData
                });

                const result = await res.json();
                console.log("Ответ от сервера:", result);

                if (result.status === "success") {
                    alert("Отзыв успешно добавлен!");
                    loadReviews(); // перезагружаем отзывы
                    showModal('modal-review');
                } else {
                    alert("Ошибка при отправке отзыва.");
                }
            } catch (err) {
                console.error("Ошибка при отправке отзыва:", err);
            }
        });
    }
});