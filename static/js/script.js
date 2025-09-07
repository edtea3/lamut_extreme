document.addEventListener("DOMContentLoaded", function () {
    // === 1. Анимации ===
    const elements = document.querySelectorAll(
        ".fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right",
    );

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const el = entry.target;
                let animationType = "";
                if (el.classList.contains("fade-in-up"))
                    animationType = "fade-in-up";
                else if (el.classList.contains("fade-in-down"))
                    animationType = "fade-in-down";
                else if (el.classList.contains("fade-in-left"))
                    animationType = "fade-in-left";
                else if (el.classList.contains("fade-in-right"))
                    animationType = "fade-in-right";

                if (!animationType) return;

                if (entry.isIntersecting) {
                    el.classList.remove(`${animationType}-active`);
                    requestAnimationFrame(() =>
                        el.classList.add(`${animationType}-active`),
                    );
                } else {
                    el.classList.remove(`${animationType}-active`);
                }
            });
        },
        { threshold: 0.2, rootMargin: "0px 0px -50px 0px" },
    );

    elements.forEach((el) => observer.observe(el));

    // === 2. Анимация шапки ===
    const header = document.querySelector("header");
    if (header) {
        window.addEventListener("scroll", () => {
            header.classList.toggle("hidden", window.scrollY > 600);
        });
    }

    // === 3. Общие функции ошибок ===
    function showError(input, message) {
        input.style.borderColor = "red";
        let error = input.nextElementSibling;
        if (!error || !error.classList.contains("error-message")) {
            error = document.createElement("div");
            error.className = "error-message";
            input.parentNode.insertBefore(error, input.nextSibling);
        }
        error.textContent = message;
        error.style.color = "red";
        error.style.fontSize = "0.9em";
        error.style.marginTop = "3px";
    }

    function clearError(input) {
        input.style.borderColor = "";
        const error = input.nextElementSibling;
        if (error && error.classList.contains("error-message")) {
            error.remove();
        }
    }

    // === 4. Очистка пользовательского ввода ===
    function sanitizeInput(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // === Доп. фильтрация имени ===
    function sanitizeName(name) {
        return name.replace(/[^a-zA-Zа-яА-ЯёЁ\s-]/g, "");
    }

    // === Валидация телефона ===
    function isValidPhone(phone) {
        return /^\+?[0-9][0-9\- ]{9,14}$/.test(phone);
    }

    // === Honeypot check ===
    function isBot() {
        const hp = document.getElementById("hp-field");
        return hp && hp.value.trim().length > 0;
    }

    // === 5. Отправка заявки ===
    const requestForm = document.getElementById("requestForm");
    if (requestForm) {
        let lastRequestTime = 0;
        const requestCooldown = 30 * 1000; // 30 секунд

        requestForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            if (isBot()) {
                alert("Подозрительная активность. Запрос отклонён.");
                return;
            }

            const now = Date.now();
            if (now - lastRequestTime < requestCooldown) {
                alert(
                    `Пожалуйста, подождите ${Math.ceil(
                        (requestCooldown - (now - lastRequestTime)) / 1000,
                    )} секунд перед повторной отправкой.`,
                );
                return;
            }
            lastRequestTime = now;

            const nameInput = document.getElementById("name");
            const phoneInput = document.getElementById("phone");
            const questionInput = document.getElementById("question");

            let name = sanitizeName(sanitizeInput(nameInput.value.trim()));
            let phone = sanitizeInput(phoneInput.value.trim());
            let question = sanitizeInput(questionInput.value.trim());

            clearError(nameInput);
            clearError(phoneInput);

            let hasError = false;

            if (!name) {
                showError(nameInput, "Пожалуйста, введите имя.");
                hasError = true;
            } else if (name.length > 50) {
                showError(
                    nameInput,
                    "Имя слишком длинное (макс. 50 символов).",
                );
                hasError = true;
            }

            if (!phone) {
                showError(phoneInput, "Пожалуйста, введите телефон.");
                hasError = true;
            } else if (!isValidPhone(phone)) {
                showError(phoneInput, "Телефон введён некорректно.");
                hasError = true;
            }

            if (hasError) return;

            try {
                const csrfToken = document.querySelector(
                    "#requestForm [name=csrf_token]",
                ).value;
                const response = await fetch("/send", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-CSRFToken": csrfToken,
                    },
                    body: new URLSearchParams({ name, phone, question }),
                });

                const result = await response.json();
                if (result.status === "success") {
                    this.reset();
                    showModal("modal");
                } else {
                    alert(
                        "Произошла ошибка при отправке заявки. Попробуйте позже.",
                    );
                }
            } catch (error) {
                console.error(error);
                alert("Ошибка связи с сервером. Попробуйте позже.");
            }
        });

        ["name", "phone", "question"].forEach((id) => {
            const input = document.getElementById(id);
            input.addEventListener("input", () => clearError(input));
        });
    }

    // === 6. Загрузка отзывов (без изменений, кроме безопасности) ===
    async function loadReviews() {
        try {
            const res = await fetch("/get-reviews");
            if (!res.ok) return;

            const reviews = await res.json();
            if (!Array.isArray(reviews)) return;

            const container = document.getElementById("reviews-container");
            if (!container) return;
            container.innerHTML = "";

            let firstItem = true;
            reviews.forEach((review) => {
                if (!review.name || !review.comment || !review.rating) return;
                const rating = parseInt(review.rating, 10);
                if (isNaN(rating) || rating < 1 || rating > 5) return;

                const div = document.createElement("div");
                div.className = "review-item";
                if (firstItem) {
                    div.classList.add("active");
                    firstItem = false;
                }

                const stars = document.createElement("div");
                stars.className = "stars";
                for (let i = 0; i < 5; i++) {
                    const img = document.createElement("img");
                    img.src =
                        i < rating
                            ? "/static/img/application-review/star-filled.png"
                            : "/static/img/application-review/star-empty.png";
                    img.alt = "звезда";
                    img.className = "star-img";
                    stars.appendChild(img);
                }

                const text = document.createElement("p");
                text.className = "review-text";
                text.textContent = review.comment;

                const author = document.createElement("div");
                author.className = "review-author";
                const avatar = document.createElement("img");
                avatar.src = "/static/img/application-review/avatar.png";
                avatar.alt = "Автор";
                avatar.className = "avatar";
                const span = document.createElement("span");
                span.textContent = review.name;
                author.appendChild(avatar);
                author.appendChild(span);

                div.appendChild(stars);
                div.appendChild(text);
                div.appendChild(author);
                container.appendChild(div);
            });

            startCarousel();
        } catch (err) {
            console.error("Ошибка загрузки отзывов:", err);
        }
    }

    function startCarousel() {
        const reviews = document.querySelectorAll(".review-item");
        if (reviews.length <= 1) return;

        let index = 0;
        setInterval(() => {
            reviews[index].classList.remove("active");
            index = (index + 1) % reviews.length;
            reviews[index].classList.add("active");
        }, 6000);
    }

    loadReviews();

    // === 7. Отправка отзывов (аналогично заявке) ===
    const reviewForm = document.getElementById("reviewForm");
    if (reviewForm) {
        let lastReviewTime = 0;
        const reviewCooldown = 30 * 1000; // 30 секунд

        reviewForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (isBot()) {
                alert("Подозрительная активность. Отзыв отклонён.");
                return;
            }

            const now = Date.now();
            if (now - lastReviewTime < reviewCooldown) {
                alert(
                    `Подождите ${Math.ceil(
                        (reviewCooldown - (now - lastReviewTime)) / 1000,
                    )} секунд перед повторной отправкой.`,
                );
                return;
            }
            lastReviewTime = now;

            const name = sanitizeName(
                sanitizeInput(
                    document.getElementById("reviewName").value.trim(),
                ),
            );
            const comment = sanitizeInput(
                document.getElementById("reviewComment").value.trim(),
            );
            const rating = document.querySelector(
                'input[name="rating"]:checked',
            )?.value;

            if (!name || !comment || !rating) {
                alert("Пожалуйста, заполните все поля и выберите рейтинг.");
                return;
            }

            const csrfToken = document.querySelector(
                "#reviewForm [name=csrf_token]",
            ).value;

            try {
                const res = await fetch("/submit-review", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-CSRFToken": csrfToken,
                    },
                    body: new URLSearchParams({
                        reviewName: name,
                        reviewComment: comment,
                        rating,
                    }),
                });

                const result = await res.json();
                if (result.status === "success") {
                    reviewForm.reset();
                    loadReviews();
                    showModal("modal-review");
                } else {
                    alert("Ошибка при отправке отзыва. Попробуйте позже.");
                }
            } catch (err) {
                console.error("Ошибка при отправке отзыва:", err);
            }
        });
    }

    // === 8. Подсказки для полей отзывов ===
    ["reviewName", "reviewComment"].forEach((id) => {
        const input = document.getElementById(id);
        input.addEventListener("input", () => clearError(input));
    });
});
