// =====================================================
// KGECSIH INTERNSHIP PAGE
// =====================================================


// =====================================================
// AUTHENTICATION
// =====================================================

const token =
    localStorage.getItem("token");


if (!token) {

    window.location.href =
        "/pages/auth/auth.html?mode=login";

}



// =====================================================
// HEADER ELEMENTS
// =====================================================

const navName =
    document.getElementById("navName");

const avatar =
    document.getElementById("avatar");

const sidebarAvatar =
    document.getElementById("sidebarAvatar");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const logoutBtn =
    document.getElementById("logoutBtn");



// =====================================================
// FILTER ELEMENTS
// =====================================================

const keywordInput =
    document.getElementById("keyword");

const companyInput =
    document.getElementById("company");

const locationInput =
    document.getElementById("location");

const workTypeSelect =
    document.getElementById("workType");

const maxDurationSelect =
    document.getElementById("maxDuration");

const sortBySelect =
    document.getElementById("sortBy");

const sortOrderSelect =
    document.getElementById("sortOrder");

const applyFiltersBtn =
    document.getElementById(
        "applyFiltersBtn"
    );

const clearFiltersBtn =
    document.getElementById(
        "clearFiltersBtn"
    );

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );



// =====================================================
// RESULT ELEMENTS
// =====================================================

const internshipContainer =
    document.getElementById(
        "internshipContainer"
    );

const resultCount =
    document.getElementById(
        "resultCount"
    );

const resultMessage =
    document.getElementById(
        "resultMessage"
    );



// =====================================================
// AUTHENTICATED FETCH
// =====================================================

async function authenticatedFetch(
    url,
    options = {}
) {

    const headers = {

        ...(options.headers || {}),

        "Authorization":
            `Bearer ${token}`

    };


    return fetch(
        url,
        {
            ...options,
            headers
        }
    );

}



// =====================================================
// LOAD LOGGED-IN USER PROFILE
// =====================================================

async function loadUserProfile() {

    try {

        const response =
            await authenticatedFetch(
                "/api/profile"
            );


        if (
            response.status === 401
        ) {

            logout();

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : "Unable to load profile."
            );

        }


        const student =
            data.student || {};


        // ---------------------------------------------
        // NAME
        // ---------------------------------------------

        const name =
            student.full_name ||
            "Student";


        // ---------------------------------------------
        // EMAIL
        // ---------------------------------------------

        const email =
            student.email ||
            "";


        // ---------------------------------------------
        // INITIALS
        // ---------------------------------------------

        const initials =
            getInitials(name);


        // ---------------------------------------------
        // TOP NAVBAR
        // ---------------------------------------------

        if (navName) {

            navName.textContent =
                name;

        }


        if (avatar) {

            avatar.textContent =
                initials;

        }


        // ---------------------------------------------
        // SIDEBAR PROFILE
        // ---------------------------------------------

        if (profileName) {

            profileName.textContent =
                name;

        }


        if (profileEmail) {

            profileEmail.textContent =
                email;

        }


        if (sidebarAvatar) {

            sidebarAvatar.textContent =
                initials;

        }


        // ---------------------------------------------
        // USE USER PREFERENCES AS INITIAL FILTERS
        // ---------------------------------------------

        if (
            student.preferred_work_location &&
            locationInput
        ) {

            locationInput.value =
                student.preferred_work_location;

        }


        if (
            student.work_preference &&
            workTypeSelect
        ) {

            const preference =
                student.work_preference;


            if (
                preference === "On-site" ||
                preference === "Remote" ||
                preference === "Hybrid"
            ) {

                workTypeSelect.value =
                    preference;

            }

        }

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}



// =====================================================
// INITIALS
// =====================================================

function getInitials(
    name
) {

    if (!name) {

        return "S";

    }


    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}



// =====================================================
// LOAD INTERNSHIPS
// =====================================================

async function loadInternships() {

    showLoading();


    try {

        /*
         * IMPORTANT:
         *
         * Do NOT send student_id.
         *
         * The backend gets the logged-in student's
         * ID from the JWT Authorization header.
         */


        const params =
            new URLSearchParams();


        // ---------------------------------------------
        // SEARCH
        // ---------------------------------------------

        const keyword =
            keywordInput
                ? keywordInput.value.trim()
                : "";


        if (keyword) {

            params.set(
                "keyword",
                keyword
            );

        }


        // ---------------------------------------------
        // COMPANY
        // ---------------------------------------------

        const company =
            companyInput
                ? companyInput.value.trim()
                : "";


        if (company) {

            params.set(
                "company",
                company
            );

        }


        // ---------------------------------------------
        // LOCATION
        // ---------------------------------------------

        const location =
            locationInput
                ? locationInput.value.trim()
                : "";


        if (location) {

            params.set(
                "location",
                location
            );

        }


        // ---------------------------------------------
        // WORK TYPE
        // ---------------------------------------------

        if (
            workTypeSelect &&
            workTypeSelect.value
        ) {

            params.set(
                "work_type",
                workTypeSelect.value
            );

        }


        // ---------------------------------------------
        // MAXIMUM DURATION
        // ---------------------------------------------

        if (
            maxDurationSelect &&
            maxDurationSelect.value
        ) {

            params.set(
                "max_duration",
                maxDurationSelect.value
            );

        }


        // ---------------------------------------------
        // SORT
        // ---------------------------------------------

        params.set(
            "sort_by",
            sortBySelect
                ? sortBySelect.value
                : "match"
        );


        params.set(
            "order",
            sortOrderSelect
                ? sortOrderSelect.value
                : "desc"
        );


        // ---------------------------------------------
        // TOP 10
        // ---------------------------------------------

        params.set(
            "limit",
            "10"
        );


        // ---------------------------------------------
        // REQUEST
        // ---------------------------------------------

        const response =
            await authenticatedFetch(
                `/internships/?${params.toString()}`
            );


        if (
            response.status === 401
        ) {

            logout();

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : "Unable to load internships."
            );

        }


        const internships =
            data.internships || [];


        renderInternships(
            internships
        );


        if (resultCount) {

            resultCount.textContent =
                `Top ${internships.length} match${
                    internships.length === 1
                        ? ""
                        : "es"
                }`;

        }


        if (resultMessage) {

            resultMessage.textContent =
                internships.length
                    ? "Click an internship to view details"
                    : "No matching internships found";

        }

    }

    catch (error) {

        console.error(
            "Internship loading error:",
            error
        );


        showError(
            error.message
        );

    }

}



// =====================================================
// RENDER INTERNSHIPS
// =====================================================

function renderInternships(
    internships
) {

    if (!internshipContainer) {

        return;

    }


    internshipContainer.innerHTML =
        "";


    if (
        !internships ||
        internships.length === 0
    ) {

        internshipContainer.innerHTML =
            `
            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No internships found
                </h3>

                <p>
                    Try changing your filters
                    or search criteria.
                </p>

            </div>
            `;

        return;

    }


    internships.forEach(
        function (internship) {

            internshipContainer.appendChild(
                createInternshipCard(
                    internship
                )
            );

        }
    );

}



// =====================================================
// CREATE INTERNSHIP CARD
// =====================================================

function createInternshipCard(
    internship
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "internship-row";


    const score =
        Number(
            internship.match_score || 0
        );


    const matchClass =
        getMatchClass(score);


    card.innerHTML =
        `
        <button
            type="button"
            class="internship-summary"
            aria-expanded="false"
        >

            <div class="summary-company">

                <span class="company-name">
                    ${escapeHtml(
                        internship.company_name
                    )}
                </span>

                <span class="internship-title-small">
                    ${escapeHtml(
                        internship.internship_title
                    )}
                </span>

            </div>


            <div class="summary-item">

                <span class="summary-label">
                    LOCATION
                </span>

                <span class="summary-value">
                    ${escapeHtml(
                        internship.location ||
                        "Not specified"
                    )}
                </span>

            </div>


            <div class="summary-item">

                <span class="summary-label">
                    POSITION
                </span>

                <span class="summary-value">
                    ${escapeHtml(
                        internship.position ||
                        "Not specified"
                    )}
                </span>

            </div>


            <div class="summary-item">

                <span class="summary-label">
                    LAST DATE
                </span>

                <span class="summary-value">
                    ${formatDate(
                        internship.last_date_to_apply
                    )}
                </span>

            </div>


            <div class="match-cell">

                <div
                    class="match-circle ${matchClass}"
                >
                    ${Math.round(score)}%
                </div>

            </div>

        </button>


        <div class="internship-details">

            ${createDetailsHtml(
                internship,
                score
            )}

        </div>
        `;


    const summary =
        card.querySelector(
            ".internship-summary"
        );


    summary.addEventListener(
        "click",
        function () {

            const expanded =
                card.classList.contains(
                    "expanded"
                );


            // -----------------------------------------
            // Close all other cards
            // -----------------------------------------

            document
                .querySelectorAll(
                    ".internship-row.expanded"
                )
                .forEach(
                    function (otherCard) {

                        if (
                            otherCard !== card
                        ) {

                            otherCard.classList.remove(
                                "expanded"
                            );


                            const otherButton =
                                otherCard.querySelector(
                                    ".internship-summary"
                                );


                            if (otherButton) {

                                otherButton.setAttribute(
                                    "aria-expanded",
                                    "false"
                                );

                            }

                        }

                    }
                );


            // -----------------------------------------
            // Toggle current card
            // -----------------------------------------

            card.classList.toggle(
                "expanded",
                !expanded
            );


            summary.setAttribute(
                "aria-expanded",
                String(!expanded)
            );

        }
    );


    return card;

}



// =====================================================
// DETAILS
// =====================================================

function createDetailsHtml(
    internship,
    score
) {

    const matchedSkills =
        internship.matched_skills || [];


    const missingSkills =
        internship.missing_skills || [];


    const matchedHtml =
        matchedSkills.length

            ? matchedSkills
                .map(
                    function (skill) {

                        return `
                            <span
                                class="skill-pill skill-matched"
                            >
                                ✓ ${escapeHtml(skill)}
                            </span>
                        `;

                    }
                )
                .join("")

            : `
                <span class="no-skills">
                    No listed skills matched.
                </span>
            `;


    const missingHtml =
        missingSkills.length

            ? missingSkills
                .map(
                    function (skill) {

                        return `
                            <span
                                class="skill-pill skill-missing"
                            >
                                ${escapeHtml(skill)}
                            </span>
                        `;

                    }
                )
                .join("")

            : `
                <span
                    class="skill-pill skill-matched"
                >
                    ✓ All listed skills matched
                </span>
            `;


    const applicationUrl =
        internship.application_url;


    const applyHtml =
        applicationUrl

            ? `
                <a
                    class="internship-apply-button"
                    href="${escapeAttribute(
                        applicationUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Apply Now →
                </a>
                `

            : `
                <span class="no-skills">
                    Application link unavailable
                </span>
                `;

                
    const deadline =
        formatDeadline(
            internship.last_date_to_apply
        );


    return `
        <div class="details-header">

            <div>

                <div class="details-title">

                    ${escapeHtml(
                        internship.internship_title
                    )}

                </div>


                <div class="details-company">

                    ${escapeHtml(
                        internship.company_name
                    )}

                </div>


                ${
                    internship.position
                        ? `
                            <div class="position">

                                <strong>
                                    Position:
                                </strong>

                                ${escapeHtml(
                                    internship.position
                                )}

                            </div>
                        `
                        : ""
                }

            </div>


            <div>

                <div
                    class="match-circle ${getMatchClass(
                        score
                    )}"
                >
                    ${Math.round(score)}%
                </div>

            </div>

        </div>



        <div class="details-meta">


            <div class="detail-box">

                <span class="detail-box-label">
                    Location
                </span>

                <span class="detail-box-value">
                    ${escapeHtml(
                        internship.location ||
                        "Not specified"
                    )}
                </span>

            </div>


            <div class="detail-box">

                <span class="detail-box-label">
                    Work Type
                </span>

                <span class="detail-box-value">
                    ${escapeHtml(
                        internship.work_type ||
                        "Not specified"
                    )}
                </span>

            </div>


            <div class="detail-box">

                <span class="detail-box-label">
                    Duration
                </span>

                <span class="detail-box-value">
                    ${formatDuration(
                        internship.duration_months
                    )}
                </span>

            </div>


            <div class="detail-box">

                <span class="detail-box-label">
                    Minimum Experience
                </span>

                <span class="detail-box-value">
                    ${formatDuration(
                        internship.min_experience_months
                    )}
                </span>

            </div>

        </div>



        <div class="skill-section">

            <h4>
                Skills matched
            </h4>

            <div class="skills-list">

                ${matchedHtml}

            </div>

        </div>



        <div class="skill-section">

            <h4>
                Skills not matched
            </h4>

            <div class="skills-list">

                ${missingHtml}

            </div>

        </div>



        <div class="description">

            <h4>
                Description
            </h4>

            <p>
                ${escapeHtml(
                    internship.description ||
                    "No description provided."
                )}
            </p>

        </div>



        <div class="details-footer">

            <div>

                <div class="stipend">

                    ${formatStipend(
                        internship.stipend_min,
                        internship.stipend_max
                    )}

                </div>


                <div
                    class="deadline ${
                        deadline.urgent
                            ? "deadline-urgent"
                            : ""
                    }"
                >

                    ${deadline.text}

                </div>

            </div>


            <div>

                ${applyHtml}

            </div>

        </div>
    `;

}



// =====================================================
// MATCH COLOUR
// =====================================================

function getMatchClass(
    score
) {

    if (score >= 80) {

        return "match-excellent";

    }


    if (score >= 60) {

        return "match-good";

    }


    if (score >= 40) {

        return "match-medium";

    }


    return "match-low";

}



// =====================================================
// DATE
// =====================================================

function formatDate(
    value
) {

    if (!value) {

        return "Not specified";

    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}



// =====================================================
// DEADLINE
// =====================================================

function formatDeadline(
    value
) {

    if (!value) {

        return {
            text: "Deadline not specified",
            urgent: false
        };

    }


    const deadline =
        new Date(
            `${value}T00:00:00`
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        Math.ceil(
            (
                deadline - today
            ) /
            86400000
        );


    if (difference <= 0) {

        return {
            text: "Apply today",
            urgent: true
        };

    }


    if (difference <= 7) {

        return {
            text:
                `Apply within ${difference} day${
                    difference === 1
                        ? ""
                        : "s"
                }`,
            urgent: true
        };

    }


    return {
        text:
            `Apply by: ${formatDate(value)}`,
        urgent: false
    };

}



// =====================================================
// STIPEND
// =====================================================

function formatStipend(
    min,
    max
) {

    const minimum =
        Number(min || 0);


    const maximum =
        Number(max || 0);


    if (
        minimum &&
        maximum
    ) {

        return (
            `₹${formatNumber(minimum)} – ` +
            `₹${formatNumber(maximum)} / month`
        );

    }


    if (maximum) {

        return (
            `Up to ₹${formatNumber(maximum)} / month`
        );

    }


    if (minimum) {

        return (
            `₹${formatNumber(minimum)}+ / month`
        );

    }


    return "Stipend not specified";

}



// =====================================================
// DURATION
// =====================================================

function formatDuration(
    value
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "Not specified";

    }


    return (
        `${number} month${
            number === 1
                ? ""
                : "s"
        }`
    );

}



// =====================================================
// NUMBER FORMAT
// =====================================================

function formatNumber(
    value
) {

    return Number(value)
        .toLocaleString("en-IN");

}



// =====================================================
// CLEAR FILTERS
// =====================================================

if (clearFiltersBtn) {

    clearFiltersBtn.addEventListener(
        "click",
        function () {

            if (keywordInput) {

                keywordInput.value = "";

            }


            if (companyInput) {

                companyInput.value = "";

            }


            if (locationInput) {

                locationInput.value = "";

            }


            if (workTypeSelect) {

                workTypeSelect.value = "";

            }


            if (maxDurationSelect) {

                maxDurationSelect.value = "";

            }


            if (sortBySelect) {

                sortBySelect.value = "match";

            }


            if (sortOrderSelect) {

                sortOrderSelect.value = "desc";

            }


            loadInternships();

        }
    );

}



// =====================================================
// SEARCH
// =====================================================

if (applyFiltersBtn) {

    applyFiltersBtn.addEventListener(
        "click",
        loadInternships
    );

}



// =====================================================
// REFRESH
// =====================================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadInternships
    );

}



// =====================================================
// ENTER TO SEARCH
// =====================================================

[
    keywordInput,
    companyInput,
    locationInput
]
.filter(Boolean)
.forEach(
    function (input) {

        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    loadInternships();

                }

            }
        );

    }
);



// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem(
        "token"
    );


    // Old values can be removed too.
    // Internship matching does NOT use them.

    localStorage.removeItem(
        "student_id"
    );

    localStorage.removeItem(
        "full_name"
    );


    window.location.href =
        "/pages/auth/auth.html?mode=login";

}



if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );

}



// =====================================================
// HTML ESCAPING
// =====================================================

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}



// =====================================================
// ATTRIBUTE ESCAPING
// =====================================================

function escapeAttribute(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    );

}



// =====================================================
// LOADING STATE
// =====================================================

function showLoading() {

    if (resultCount) {

        resultCount.textContent =
            "Finding matches...";

    }


    if (resultMessage) {

        resultMessage.textContent =
            "Please wait";

    }


    if (internshipContainer) {

        internshipContainer.innerHTML =
            `
            <div class="loading-state">

                <div class="loading-spinner">
                    ⟳
                </div>

                <h3>
                    Finding internships...
                </h3>

                <p>
                    Matching opportunities
                    with your profile.
                </p>

            </div>
            `;

    }

}



// =====================================================
// ERROR STATE
// =====================================================

function showError(
    message
) {

    if (resultCount) {

        resultCount.textContent =
            "Unable to load internships";

    }


    if (resultMessage) {

        resultMessage.textContent =
            "Please try again";

    }


    if (internshipContainer) {

        internshipContainer.innerHTML =
            `
            <div class="error-state">

                <div class="error-icon">
                    ⚠️
                </div>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHtml(
                        message ||
                        "Unable to load internships."
                    )}
                </p>

                <button
                    type="button"
                    class="retry-btn"
                    id="retryInternshipsBtn"
                >
                    Try Again
                </button>

            </div>
            `;


        const retryBtn =
            document.getElementById(
                "retryInternshipsBtn"
            );


        if (retryBtn) {

            retryBtn.addEventListener(
                "click",
                loadInternships
            );

        }

    }

}



// =====================================================
// INITIALIZE
// =====================================================

async function initializePage() {

    // First load the actual logged-in user.
    await loadUserProfile();


    // Then load internships for that same user.
    await loadInternships();

}


initializePage();