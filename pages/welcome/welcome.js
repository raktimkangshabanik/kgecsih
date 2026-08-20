// =========================================================
// WELCOME PAGE JAVASCRIPT
// =========================================================


// Navigate to authentication page

function goToAuth(mode) {

    window.location.href =
        `/pages/auth/auth.html?mode=${mode}`;

}


// =========================================================
// SMALL INTERACTION
// =========================================================


// Add a subtle click effect to the main button

const getStartedButton =
    document.querySelector(".primary-btn");


if (getStartedButton) {

    getStartedButton.addEventListener(
        "click",
        function () {

            this.style.transform =
                "scale(0.96)";

            setTimeout(() => {

                this.style.transform = "";

            }, 120);

        }
    );

}