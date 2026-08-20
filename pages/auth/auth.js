// =====================================================
// AUTH PAGE
// Login + Signup + Password UI
// =====================================================


// =====================================================
// GET ELEMENTS
// =====================================================

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const switchToSignup =
    document.getElementById("switchToSignup");

const switchToLogin =
    document.getElementById("switchToLogin");


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin() {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    document.title = "KGECSIH | Login";

}


// =====================================================
// SHOW SIGNUP
// =====================================================

function showSignup() {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    document.title = "KGECSIH | Sign Up";

}


// =====================================================
// TAB BUTTONS
// =====================================================

loginTab.addEventListener(
    "click",
    showLogin
);

signupTab.addEventListener(
    "click",
    showSignup
);

switchToSignup.addEventListener(
    "click",
    showSignup
);

switchToLogin.addEventListener(
    "click",
    showLogin
);


// =====================================================
// READ URL
// Example:
// /pages/auth/auth.html?mode=signup
// =====================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const mode =
    urlParams.get("mode");


if (mode === "signup") {

    showSignup();

} else {

    showLogin();

}


// =====================================================
// SHOW / HIDE PASSWORD
// =====================================================

const passwordButtons =
    document.querySelectorAll(
        ".show-password"
    );


passwordButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const targetId =
                    this.getAttribute(
                        "data-target"
                    );

                const passwordInput =
                    document.getElementById(
                        targetId
                    );


                if (
                    passwordInput.type ===
                    "password"
                ) {

                    passwordInput.type =
                        "text";

                    this.textContent =
                        "🙈";

                } else {

                    passwordInput.type =
                        "password";

                    this.textContent =
                        "👁";

                }

            }
        );

    }
);


// =====================================================
// PASSWORD STRENGTH
// =====================================================

const signupPassword =
    document.getElementById(
        "signupPassword"
    );

const passwordStrength =
    document.getElementById(
        "passwordStrength"
    );


signupPassword.addEventListener(
    "input",
    function () {

        const password =
            this.value;


        // Empty password

        if (password.length === 0) {

            passwordStrength.style.width =
                "0%";

            return;

        }


        let score = 0;


        // At least 8 characters

        if (password.length >= 8) {

            score++;

        }


        // Contains number

        if (/[0-9]/.test(password)) {

            score++;

        }


        // Contains uppercase

        if (/[A-Z]/.test(password)) {

            score++;

        }


        // Contains special character

        if (
            /[^A-Za-z0-9]/.test(password)
        ) {

            score++;

        }


        // Update strength bar

        if (score === 1) {

            passwordStrength.style.width =
                "25%";

            passwordStrength.style.background =
                "#ef4444";

        }

        else if (score === 2) {

            passwordStrength.style.width =
                "50%";

            passwordStrength.style.background =
                "#f59e0b";

        }

        else if (score === 3) {

            passwordStrength.style.width =
                "75%";

            passwordStrength.style.background =
                "#eab308";

        }

        else {

            passwordStrength.style.width =
                "100%";

            passwordStrength.style.background =
                "#10b981";

        }

    }
);


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document.getElementById(
                "loginEmail"
            ).value.trim();


        const password =
            document.getElementById(
                "loginPassword"
            ).value;


        const message =
            document.getElementById(
                "loginMessage"
            );


        message.textContent = "";


        // Basic validation

        if (
            email === "" ||
            password === ""
        ) {

            message.textContent =
                "Please enter your email and password.";

            message.style.color =
                "#ef4444";

            return;

        }


        try {

            // Send login request to FastAPI

            const response =
                await fetch(
                    "/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            // Server returned an error

            if (!response.ok) {

                message.textContent =
                    data.detail ||
                    "Invalid email or password.";

                message.style.color =
                    "#ef4444";

                return;

            }


            // Login successful

            localStorage.setItem(
                "token",
                data.token
            );


            localStorage.setItem(
                "student_id",
                data.student_id
            );


            localStorage.setItem(
                "full_name",
                data.full_name
            );


            message.textContent =
                "Login successful!";

            message.style.color =
                "#10b981";


            // Go to profile

            setTimeout(
                function () {

                    window.location.href =
                        "/pages/profile/profile.html";

                },
                700
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            message.textContent =
                "Cannot connect to server.";

            message.style.color =
                "#ef4444";

        }

    }
);


// =====================================================
// SIGNUP
// =====================================================

signupForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            document.getElementById(
                "signupName"
            ).value.trim();


        const email =
            document.getElementById(
                "signupEmail"
            ).value.trim();


        const password =
            document.getElementById(
                "signupPassword"
            ).value;


        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            ).value;


        const message =
            document.getElementById(
                "signupMessage"
            );


        message.textContent = "";


        // =================================================
        // VALIDATION
        // =================================================

        if (
            name === "" ||
            email === "" ||
            password === "" ||
            confirmPassword === ""
        ) {

            message.textContent =
                "Please fill in all fields.";

            message.style.color =
                "#ef4444";

            return;

        }


        if (password.length < 8) {

            message.textContent =
                "Password must be at least 8 characters.";

            message.style.color =
                "#ef4444";

            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            message.textContent =
                "Passwords do not match.";

            message.style.color =
                "#ef4444";

            return;

        }


        try {

            // Send signup request to FastAPI

            const response =
                await fetch(
                    "/api/auth/signup",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            full_name: name,
                            email: email,
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            // Server error

            if (!response.ok) {

                message.textContent =
                    data.detail ||
                    "Unable to create account.";

                message.style.color =
                    "#ef4444";

                return;

            }


            // =================================================
            // ACCOUNT CREATED
            // =================================================

            localStorage.setItem(
                "token",
                data.token
            );


            localStorage.setItem(
                "student_id",
                data.student_id
            );


            message.textContent =
                "Account created successfully!";

            message.style.color =
                "#10b981";


            // Go to profile

            setTimeout(
                function () {

                    window.location.href =
                        "/pages/profile/profile.html";

                },
                700
            );


        } catch (error) {

            console.error(
                "Signup error:",
                error
            );


            message.textContent =
                "Cannot connect to server.";

            message.style.color =
                "#ef4444";

        }

    }
);