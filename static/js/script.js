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

});