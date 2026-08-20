// =====================================================
// PROFILE PAGE
// =====================================================

const token = localStorage.getItem("token");

if (!token) {
    window.location.href =
        "/pages/auth/auth.html?mode=login";
}


// =====================================================
// ELEMENTS
// =====================================================

const fullName =
    document.getElementById("fullName");

const email =
    document.getElementById("email");

const phone =
    document.getElementById("phone");

const locationInput =
    document.getElementById("location");

const qualification =
    document.getElementById("qualification");

const fieldOfStudy =
    document.getElementById("fieldOfStudy");

const graduationYear =
    document.getElementById("graduationYear");

const experienceContainer =
    document.getElementById("experienceContainer");

const addExperienceBtn =
    document.getElementById("addExperienceBtn");

const workPreference =
    document.getElementById("workPreference");

const preferredLocation =
    document.getElementById("preferredLocation");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const navName =
    document.getElementById("navName");

const avatar =
    document.getElementById("avatar");

const sidebarAvatar =
    document.getElementById("sidebarAvatar");

const message =
    document.getElementById("message");

const professionalMessage =
    document.getElementById("professionalMessage");

const skillsContainer =
    document.getElementById("skillsContainer");

const skillSelect =
    document.getElementById("skillSelect");

const proficiencySelect =
    document.getElementById("proficiencySelect");

const addSkillBtn =
    document.getElementById("addSkillBtn");

const skillMessage =
    document.getElementById("skillMessage");

const otherSkillInput =
    document.getElementById("otherSkillInput");

const languageSelect =
    document.getElementById("languageSelect");

const otherLanguageInput =
    document.getElementById("otherLanguageInput");

const languageProficiencySelect =
    document.getElementById("languageProficiencySelect");

const addLanguageBtn =
    document.getElementById("addLanguageBtn");

const languagesContainer =
    document.getElementById("languagesContainer");

const languageMessage =
    document.getElementById("languageMessage");

const logoutBtn =
    document.getElementById("logoutBtn");


// =====================================================
// BUTTONS
// =====================================================

const personalEditBtn =
    document.getElementById("personalEditBtn");

const personalSaveBtn =
    document.getElementById("personalSaveBtn");

const personalCancelBtn =
    document.getElementById("personalCancelBtn");

const professionalEditBtn =
    document.getElementById("professionalEditBtn");

const professionalSaveBtn =
    document.getElementById("professionalSaveBtn");

const professionalCancelBtn =
    document.getElementById("professionalCancelBtn");

const skillsEditBtn =
    document.getElementById("skillsEditBtn");

const skillsSaveBtn =
    document.getElementById("skillsSaveBtn");

const skillsCancelBtn =
    document.getElementById("skillsCancelBtn");


// =====================================================
// EDIT STATES
// =====================================================

let personalEditing = false;
let professionalEditing = false;
let skillsEditing = false;


// =====================================================
// DATA
// =====================================================

let originalSkills = [];
let currentSkills = [];

let originalLanguages = [];
let currentLanguages = [];


// =====================================================
// MESSAGE TIMER
// Every message disappears after 2 seconds
// =====================================================

const messageTimers = new WeakMap();

function showTemporaryMessage(
    element,
    text,
    color
) {

    if (!element) {
        return;
    }

    const oldTimer =
        messageTimers.get(element);

    if (oldTimer) {
        clearTimeout(oldTimer);
    }

    element.textContent = text;
    element.style.color = color;

    const timer =
        setTimeout(
            function () {
                element.textContent = "";
            },
            2000
        );

    messageTimers.set(
        element,
        timer
    );
}


// =====================================================
// AUTHENTICATED FETCH
// =====================================================

async function authenticatedFetch(
    url,
    options = {}
) {

    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
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
// PHONE INPUT
// =====================================================

phone.addEventListener(
    "input",
    function () {

        let digits =
            this.value.replace(
                /\D/g,
                ""
            );

        digits =
            digits.substring(
                0,
                10
            );

        if (digits.length > 5) {

            this.value =
                `${digits.substring(0, 5)}-${digits.substring(5)}`;

        } else {

            this.value =
                digits;

        }

    }
);


// =====================================================
// PHONE FORMAT
// =====================================================

function formatPhoneForInput(
    value
) {

    if (!value) {
        return "";
    }

    let digits =
        String(value).replace(
            /\D/g,
            ""
        );

    if (
        digits.startsWith("91") &&
        digits.length === 12
    ) {

        digits =
            digits.substring(2);

    }

    digits =
        digits.substring(
            0,
            10
        );

    if (digits.length > 5) {

        return (
            `${digits.substring(0, 5)}-` +
            `${digits.substring(5)}`
        );

    }

    return digits;
}


// =====================================================
// SIDEBAR
// =====================================================

const sidebarItems =
    document.querySelectorAll(
        ".sidebar-item"
    );

const profileSections =
    document.querySelectorAll(
        ".profile-section"
    );

sidebarItems.forEach(
    function (item) {

        item.addEventListener(
            "click",
            function () {

                const target =
                    this.dataset.section;

                if (!target) {
                    return;
                }

                sidebarItems.forEach(
                    function (element) {

                        element.classList.remove(
                            "active"
                        );

                    }
                );

                profileSections.forEach(
                    function (section) {

                        section.classList.remove(
                            "active"
                        );

                    }
                );

                this.classList.add(
                    "active"
                );

                const section =
                    document.getElementById(
                        target
                    );

                if (section) {

                    section.classList.add(
                        "active"
                    );

                }

                window.location.hash =
                    target;

            }
        );

    }
);


// =====================================================
// HASH NAVIGATION
// =====================================================

function loadSectionFromHash() {

    const hash =
        window.location.hash.substring(1);

    if (!hash) {
        return;
    }

    if (hash === "internships") {

        window.location.replace(
            "/pages/internship/internship.html"
        );

        return;
    }

    const item =
        document.querySelector(
            `.sidebar-item[data-section="${hash}"]`
        );

    if (item) {
        item.click();
    }
}


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile() {

    try {

        const response =
            await authenticatedFetch(
                "/api/profile"
            );

        if (response.status === 401) {

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

        populateProfile(data);

    }
    catch (error) {

        console.error(
            "Profile error:",
            error
        );

        showTemporaryMessage(
            message,
            "Unable to load profile.",
            "#ef4444"
        );

    }
}


// =====================================================
// POPULATE PROFILE
// =====================================================

function populateProfile(
    data
) {

    const student =
        data.student || {};

    const initials =
        getInitials(
            student.full_name
        );

    profileName.textContent =
        student.full_name ||
        "Your Profile";

    profileEmail.textContent =
        student.email ||
        "";

    navName.textContent =
        student.full_name ||
        "Student";

    avatar.textContent =
        initials;

    sidebarAvatar.textContent =
        initials;


    // PERSONAL

    fullName.value =
        student.full_name ||
        "";

    email.value =
        student.email ||
        "";

    phone.value =
        formatPhoneForInput(
            student.phone
        );

    locationInput.value =
        student.location ||
        "";


    // PROFESSIONAL

    qualification.value =
        student.highest_qualification ||
        "";

    fieldOfStudy.value =
        student.field_of_study ||
        "";

    graduationYear.value =
        student.graduation_year ||
        "";

    renderExperiences(
        data.experiences || []
    );

    workPreference.value =
        student.work_preference ||
        "Any";

    preferredLocation.value =
        student.preferred_work_location ||
        "";


    // SKILLS

    originalSkills =
        JSON.parse(
            JSON.stringify(
                data.skills || []
            )
        );

    currentSkills =
        JSON.parse(
            JSON.stringify(
                data.skills || []
            )
        );


    // LANGUAGES

    originalLanguages =
        JSON.parse(
            JSON.stringify(
                data.languages || []
            )
        );

    currentLanguages =
        JSON.parse(
            JSON.stringify(
                data.languages || []
            )
        );


    renderSkills(
        currentSkills
    );

    renderLanguages(
        currentLanguages
    );
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

    return name
        .split(" ")
        .filter(Boolean)
        .map(
            word =>
                word.charAt(0)
        )
        .slice(0, 2)
        .join("")
        .toUpperCase();
}


// =====================================================
// ENABLE / DISABLE FIELDS
// =====================================================

function setFieldsEditable(
    fields,
    editable
) {

    fields.forEach(
        function (field) {

            if (field) {

                field.disabled =
                    !editable;

            }

        }
    );
}


// =====================================================
// EDIT BUTTONS
// =====================================================

function setEditModeButtons(
    editBtn,
    saveBtn,
    cancelBtn,
    editing
) {

    editBtn.classList.toggle(
        "hidden",
        editing
    );

    saveBtn.classList.toggle(
        "hidden",
        !editing
    );

    cancelBtn.classList.toggle(
        "hidden",
        !editing
    );
}


// =====================================================
// PERSONAL EDIT
// =====================================================

personalEditBtn.addEventListener(
    "click",
    function () {

        personalEditing = true;

        setFieldsEditable(
            [
                fullName,
                phone,
                locationInput
            ],
            true
        );

        setEditModeButtons(
            personalEditBtn,
            personalSaveBtn,
            personalCancelBtn,
            true
        );

        fullName.focus();

    }
);


// =====================================================
// PERSONAL CANCEL
// =====================================================

personalCancelBtn.addEventListener(
    "click",
    async function () {

        personalEditing = false;

        await loadProfile();

        setFieldsEditable(
            [
                fullName,
                phone,
                locationInput
            ],
            false
        );

        setEditModeButtons(
            personalEditBtn,
            personalSaveBtn,
            personalCancelBtn,
            false
        );

        showTemporaryMessage(
            message,
            "Changes discarded.",
            "#64748b"
        );

    }
);


// =====================================================
// PERSONAL SAVE
// =====================================================

personalSaveBtn.addEventListener(
    "click",
    savePersonal
);

async function savePersonal() {

    const nameValue =
        fullName.value.trim();

    const phoneValue =
        phone.value.trim();

    if (!nameValue) {

        showTemporaryMessage(
            message,
            "Full name is required.",
            "#ef4444"
        );

        return;
    }

    if (
        !/^[0-9]{5}-[0-9]{5}$/.test(
            phoneValue
        )
    ) {

        showTemporaryMessage(
            message,
            "Enter a valid 10-digit phone number.",
            "#ef4444"
        );

        return;
    }

    const data = {

        full_name:
            nameValue,

        location:
            locationInput.value.trim() ||
            null,

        phone:
            `+91-${phoneValue}`

    };

    try {

        const response =
            await authenticatedFetch(
                "/api/profile/personal",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );

        if (response.status === 401) {

            logout();
            return;

        }

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                typeof result.detail === "string"
                    ? result.detail
                    : "Changes failed."
            );

        }

        await loadProfile();

        personalEditing = false;

        setFieldsEditable(
            [
                fullName,
                phone,
                locationInput
            ],
            false
        );

        setEditModeButtons(
            personalEditBtn,
            personalSaveBtn,
            personalCancelBtn,
            false
        );

        showTemporaryMessage(
            message,
            "Changes saved successfully ✓",
            "#10b981"
        );

    }
    catch (error) {

        console.error(
            "Personal save error:",
            error
        );

        showTemporaryMessage(
            message,
            "Changes failed.",
            "#ef4444"
        );

    }
}


// =====================================================
// PROFESSIONAL EDIT
// =====================================================

professionalEditBtn.addEventListener(
    "click",
    function () {

        professionalEditing = true;

        setFieldsEditable(
            [
                qualification,
                fieldOfStudy,
                graduationYear,
                workPreference,
                preferredLocation
            ],
            true
        );

        setExperienceEditable(true);

        setEditModeButtons(
            professionalEditBtn,
            professionalSaveBtn,
            professionalCancelBtn,
            true
        );

        qualification.focus();

    }
);


// =====================================================
// PROFESSIONAL CANCEL
// =====================================================

professionalCancelBtn.addEventListener(
    "click",
    async function () {

        professionalEditing = false;

        await loadProfile();

        setFieldsEditable(
            [
                qualification,
                fieldOfStudy,
                graduationYear,
                workPreference,
                preferredLocation
            ],
            false
        );

        setExperienceEditable(false);

        setEditModeButtons(
            professionalEditBtn,
            professionalSaveBtn,
            professionalCancelBtn,
            false
        );

        showTemporaryMessage(
            professionalMessage,
            "Changes discarded.",
            "#64748b"
        );

    }
);


// =====================================================
// PROFESSIONAL SAVE
// =====================================================

professionalSaveBtn.addEventListener(
    "click",
    saveProfessional
);

async function saveProfessional() {

    if (!qualification.value) {

        showTemporaryMessage(
            professionalMessage,
            "Please select your highest qualification.",
            "#ef4444"
        );

        return;
    }

    let experiences;

    try {

        experiences =
            getExperiencePayload();

    }
    catch (error) {

        showTemporaryMessage(
            professionalMessage,
            error.message,
            "#ef4444"
        );

        return;
    }

    const data = {

        work_preference:
            workPreference.value,

        preferred_work_location:
            preferredLocation.value.trim() ||
            null,

        experiences:
            experiences,

        highest_qualification:
            qualification.value,

        field_of_study:
            fieldOfStudy.value.trim() ||
            null,

        graduation_year:
            graduationYear.value
                ? Number(
                    graduationYear.value
                )
                : null

    };

    try {

        const response =
            await authenticatedFetch(
                "/api/profile/professional",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );

        if (response.status === 401) {

            logout();
            return;

        }

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                typeof result.detail === "string"
                    ? result.detail
                    : "Changes failed."
            );

        }

        await loadProfile();

        professionalEditing = false;

        setFieldsEditable(
            [
                qualification,
                fieldOfStudy,
                graduationYear,
                workPreference,
                preferredLocation
            ],
            false
        );

        setExperienceEditable(false);

        setEditModeButtons(
            professionalEditBtn,
            professionalSaveBtn,
            professionalCancelBtn,
            false
        );

        showTemporaryMessage(
            professionalMessage,
            "Changes saved successfully ✓",
            "#10b981"
        );

    }
    catch (error) {

        console.error(
            "Professional save error:",
            error
        );

        showTemporaryMessage(
            professionalMessage,
            "Changes failed.",
            "#ef4444"
        );

    }
}


// =====================================================
// LOAD AVAILABLE SKILLS
// =====================================================

async function loadAvailableSkills() {

    try {

        const response =
            await authenticatedFetch(
                "/api/profile/skills"
            );

        if (response.status === 401) {

            logout();
            return;

        }

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : "Unable to load skills."
            );

        }

        skillSelect.innerHTML =
            `
            <option value="">
                Select a skill
            </option>
            `;

        (data.skills || []).forEach(
            function (skill) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    skill.skill_id;

                option.textContent =
                    skill.skill_name;

                skillSelect.appendChild(
                    option
                );

            }
        );

        const otherOption =
            document.createElement(
                "option"
            );

        otherOption.value =
            "other";

        otherOption.textContent =
            "Other";

        skillSelect.appendChild(
            otherOption
        );

    }
    catch (error) {

        console.error(
            "Available skills error:",
            error
        );

    }
}


// =====================================================
// SKILLS EDIT
// =====================================================

skillsEditBtn.addEventListener(
    "click",
    function () {

        skillsEditing = true;

        setFieldsEditable(
            [
                skillSelect,
                proficiencySelect,
                addSkillBtn,
                otherSkillInput,
                languageSelect,
                otherLanguageInput,
                languageProficiencySelect,
                addLanguageBtn
            ],
            true
        );

        setEditModeButtons(
            skillsEditBtn,
            skillsSaveBtn,
            skillsCancelBtn,
            true
        );

        renderSkills(
            currentSkills
        );

        renderLanguages(
            currentLanguages
        );

    }
);


// =====================================================
// OTHER SKILL
// =====================================================

skillSelect.addEventListener(
    "change",
    function () {

        const isOther =
            this.value === "other";

        otherSkillInput.classList.toggle(
            "hidden",
            !isOther
        );

        otherSkillInput.disabled =
            !skillsEditing ||
            !isOther;

        if (isOther) {
            otherSkillInput.focus();
        }

    }
);


// =====================================================
// ADD SKILL
// =====================================================

addSkillBtn.addEventListener(
    "click",
    async function () {

        const selectedValue =
            skillSelect.value;

        const proficiency =
            proficiencySelect.value;

        if (!selectedValue) {

            showTemporaryMessage(
                skillMessage,
                "Please select a skill.",
                "#ef4444"
            );

            return;
        }


        // ---------------------------------------------
        // CUSTOM SKILL
        // ---------------------------------------------

        if (selectedValue === "other") {

            const customName =
                otherSkillInput.value.trim();

            if (!customName) {

                showTemporaryMessage(
                    skillMessage,
                    "Enter the new skill name.",
                    "#ef4444"
                );

                otherSkillInput.focus();

                return;
            }

            try {

                const response =
                    await authenticatedFetch(
                        "/api/profile/skills/custom",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    skill_name:
                                        customName,

                                    proficiency:
                                        proficiency
                                })
                        }
                    );

                if (response.status === 401) {

                    logout();
                    return;

                }

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        typeof result.detail === "string"
                            ? result.detail
                            : "Changes failed."
                    );

                }

                currentSkills.push({

                    skill_id:
                        result.skill_id,

                    skill_name:
                        result.skill_name,

                    proficiency:
                        result.proficiency

                });

                await loadAvailableSkills();

                skillSelect.value =
                    "";

                otherSkillInput.value =
                    "";

                otherSkillInput.classList.add(
                    "hidden"
                );

                otherSkillInput.disabled =
                    true;

                renderSkills(
                    currentSkills
                );

                showTemporaryMessage(
                    skillMessage,
                    "Change pending — click Save to apply.",
                    "#64748b"
                );

            }
            catch (error) {

                console.error(
                    "Custom skill error:",
                    error
                );

                showTemporaryMessage(
                    skillMessage,
                    "Changes failed.",
                    "#ef4444"
                );

            }

            return;
        }


        // ---------------------------------------------
        // NORMAL SKILL
        // ---------------------------------------------

        const skillId =
            Number(
                selectedValue
            );

        const option =
            skillSelect.options[
                skillSelect.selectedIndex
            ];

        const skillName =
            option.textContent;

        const existing =
            currentSkills.find(
                skill =>
                    Number(
                        skill.skill_id
                    ) === skillId
            );

        if (existing) {

            existing.proficiency =
                proficiency;

        }
        else {

            currentSkills.push({

                skill_id:
                    skillId,

                skill_name:
                    skillName,

                proficiency:
                    proficiency

            });

        }

        renderSkills(
            currentSkills
        );

        skillSelect.value =
            "";

        showTemporaryMessage(
            skillMessage,
            "Change pending — click Save to apply.",
            "#64748b"
        );

    }
);


// =====================================================
// LANGUAGE SELECT
// =====================================================

languageSelect.addEventListener(
    "change",
    function () {

        const isOther =
            this.value === "Other";

        otherLanguageInput.classList.toggle(
            "hidden",
            !isOther
        );

        otherLanguageInput.disabled =
            !skillsEditing ||
            !isOther;

        if (isOther) {
            otherLanguageInput.focus();
        }

    }
);


// =====================================================
// ADD LANGUAGE
// =====================================================

addLanguageBtn.addEventListener(
    "click",
    function () {

        let language =
            languageSelect.value;

        if (language === "Other") {

            language =
                otherLanguageInput.value.trim();

            if (!language) {

                showTemporaryMessage(
                    skillMessage,
                    "Enter the language name.",
                    "#ef4444"
                );

                otherLanguageInput.focus();

                return;
            }

        }

        if (!language) {

            showTemporaryMessage(
                skillMessage,
                "Please select a language.",
                "#ef4444"
            );

            return;
        }

        const proficiency =
            languageProficiencySelect.value;

        const existing =
            currentLanguages.find(
                item =>
                    String(
                        item.language_name
                    ).toLowerCase() ===
                    language.toLowerCase()
            );

        if (existing) {

            existing.proficiency =
                proficiency;

        }
        else {

            currentLanguages.push({

                language_name:
                    language,

                proficiency:
                    proficiency

            });

        }

        renderLanguages(
            currentLanguages
        );

        languageSelect.value =
            "";

        otherLanguageInput.value =
            "";

        otherLanguageInput.classList.add(
            "hidden"
        );

        otherLanguageInput.disabled =
            true;

        showTemporaryMessage(
            skillMessage,
            "Change pending — click Save to apply.",
            "#64748b"
        );

    }
);


// =====================================================
// RENDER LANGUAGES
// =====================================================

function renderLanguages(
    languages
) {

    languagesContainer.innerHTML =
        "";

    if (
        !languages ||
        languages.length === 0
    ) {

        languagesContainer.innerHTML =
            `
            <div class="loading">
                No languages added yet.
            </div>
            `;

        return;
    }

    languages.forEach(
        function (
            language,
            index
        ) {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "skill language";

            element.innerHTML =
                `
                ${escapeHtml(
                    language.language_name
                )}

                <span>
                    ${escapeHtml(
                        language.proficiency
                    )}
                </span>

                ${
                    skillsEditing
                        ? `
                            <button
                                type="button"
                                class="remove-skill-btn"
                                onclick="removeLanguage(${index})"
                                title="Remove language"
                            >
                                ×
                            </button>
                        `
                        : ""
                }
                `;

            languagesContainer.appendChild(
                element
            );

        }
    );
}


// =====================================================
// REMOVE LANGUAGE
// =====================================================

function removeLanguage(
    index
) {

    if (!skillsEditing) {
        return;
    }

    currentLanguages.splice(
        index,
        1
    );

    renderLanguages(
        currentLanguages
    );

    showTemporaryMessage(
        skillMessage,
        "Change pending — click Save to apply.",
        "#64748b"
    );
}


// =====================================================
// EXPERIENCE
// =====================================================

function renderExperiences(
    experiences
) {

    experienceContainer.innerHTML =
        "";

    const rows =
        experiences &&
        experiences.length
            ? experiences
            : [
                {
                    start_year: "",
                    end_year: "",
                    position: ""
                }
            ];

    rows.forEach(
        function (experience) {

            addExperienceRow(
                experience
            );

        }
    );

    setExperienceEditable(
        professionalEditing
    );
}


function addExperienceRow(
    experience = {
        start_year: "",
        end_year: "",
        position: ""
    }
) {

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "experience-row";

    row.innerHTML =
        `
        <div>
            <label class="experience-label">
                Year From
            </label>

            <input
                class="experience-start"
                type="number"
                min="1950"
                max="2100"
                placeholder="2024"
                value="${escapeHtml(
                    experience.start_year ?? ""
                )}"
                disabled
            >
        </div>

        <div>
            <label class="experience-label">
                Year To
            </label>

            <input
                class="experience-end"
                type="number"
                min="1950"
                max="2100"
                placeholder="2026"
                value="${escapeHtml(
                    experience.end_year ?? ""
                )}"
                disabled
            >
        </div>

        <div class="position-field">
            <label class="experience-label">
                Position
            </label>

            <input
                class="experience-position"
                type="text"
                maxlength="120"
                placeholder="Software Intern"
                value="${escapeHtml(
                    experience.position ?? ""
                )}"
                disabled
            >
        </div>

        <button
            type="button"
            class="experience-remove-btn"
            onclick="removeExperience(this)"
            disabled
        >
            Remove
        </button>
        `;

    experienceContainer.appendChild(
        row
    );
}


// =====================================================
// REMOVE EXPERIENCE
// =====================================================

function removeExperience(
    button
) {

    if (!professionalEditing) {
        return;
    }

    const rows =
        experienceContainer.querySelectorAll(
            ".experience-row"
        );

    if (rows.length === 1) {

        rows[0].querySelector(
            ".experience-start"
        ).value = "";

        rows[0].querySelector(
            ".experience-end"
        ).value = "";

        rows[0].querySelector(
            ".experience-position"
        ).value = "";

        return;
    }

    button
        .closest(".experience-row")
        .remove();
}


// =====================================================
// ADD EXPERIENCE
// =====================================================

addExperienceBtn.addEventListener(
    "click",
    function () {

        if (!professionalEditing) {
            return;
        }

        addExperienceRow();

        setExperienceEditable(
            true
        );

    }
);


// =====================================================
// EXPERIENCE PAYLOAD
// =====================================================

function getExperiencePayload() {

    const rows =
        experienceContainer.querySelectorAll(
            ".experience-row"
        );

    const experiences = [];

    rows.forEach(
        function (row) {

            const start =
                row.querySelector(
                    ".experience-start"
                ).value;

            const end =
                row.querySelector(
                    ".experience-end"
                ).value;

            const position =
                row.querySelector(
                    ".experience-position"
                ).value.trim();

            if (
                !start &&
                !end &&
                !position
            ) {

                return;
            }

            if (
                !start ||
                !end ||
                !position
            ) {

                throw new Error(
                    "Please complete every experience row."
                );

            }

            if (
                Number(end) <
                Number(start)
            ) {

                throw new Error(
                    "Experience 'Year To' cannot be before 'Year From'."
                );

            }

            experiences.push({

                start_year:
                    Number(start),

                end_year:
                    Number(end),

                position:
                    position

            });

        }
    );

    return experiences;
}


// =====================================================
// EXPERIENCE EDITABLE
// =====================================================

function setExperienceEditable(
    editable
) {

    if (!experienceContainer) {
        return;
    }

    experienceContainer
        .querySelectorAll("input")
        .forEach(
            input => {

                input.disabled =
                    !editable;

            }
        );

    experienceContainer
        .querySelectorAll(
            ".experience-remove-btn"
        )
        .forEach(
            button => {

                button.disabled =
                    !editable;

            }
        );

    addExperienceBtn.classList.toggle(
        "hidden",
        !editable
    );

    addExperienceBtn.disabled =
        !editable;
}


// =====================================================
// RENDER SKILLS
// =====================================================

function renderSkills(
    skills
) {

    skillsContainer.innerHTML =
        "";

    if (
        !skills ||
        skills.length === 0
    ) {

        skillsContainer.innerHTML =
            `
            <div class="loading">
                No skills added yet.
            </div>
            `;

        return;
    }

    skills.forEach(
        function (skill) {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "skill";

            const removeButton =
                skillsEditing
                    ? `
                        <button
                            type="button"
                            class="remove-skill-btn"
                            onclick="removeSkill(${Number(skill.skill_id)})"
                            title="Remove skill"
                        >
                            ×
                        </button>
                    `
                    : "";

            element.innerHTML =
                `
                ${escapeHtml(
                    skill.skill_name
                )}

                <span>
                    ${escapeHtml(
                        skill.proficiency
                    )}
                </span>

                ${removeButton}
                `;

            skillsContainer.appendChild(
                element
            );

        }
    );
}


// =====================================================
// REMOVE SKILL
// =====================================================

function removeSkill(
    skillId
) {

    if (!skillsEditing) {
        return;
    }

    currentSkills =
        currentSkills.filter(
            skill =>
                Number(
                    skill.skill_id
                ) !==
                Number(
                    skillId
                )
        );

    renderSkills(
        currentSkills
    );

    showTemporaryMessage(
        skillMessage,
        "Change pending — click Save to apply.",
        "#64748b"
    );
}


// =====================================================
// SAVE SKILLS + LANGUAGES
// =====================================================

skillsSaveBtn.addEventListener(
    "click",
    saveSkills
);


async function saveSkills() {

    try {

        const originalMap =
            new Map(
                originalSkills.map(
                    skill => [
                        Number(
                            skill.skill_id
                        ),
                        skill
                    ]
                )
            );

        const currentMap =
            new Map(
                currentSkills.map(
                    skill => [
                        Number(
                            skill.skill_id
                        ),
                        skill
                    ]
                )
            );


        // ---------------------------------------------
        // DELETE REMOVED SKILLS
        // ---------------------------------------------

        for (
            const skill of originalSkills
        ) {

            const id =
                Number(
                    skill.skill_id
                );

            if (
                !currentMap.has(id)
            ) {

                const response =
                    await authenticatedFetch(
                        `/api/profile/skills/${id}`,
                        {
                            method: "DELETE"
                        }
                    );

                if (
                    response.status === 401
                ) {

                    logout();
                    return;

                }

                if (
                    !response.ok &&
                    response.status !== 404
                ) {

                    throw new Error(
                        "Changes failed."
                    );

                }

            }

        }


        // ---------------------------------------------
        // ADD / UPDATE SKILLS
        // ---------------------------------------------

        for (
            const skill of currentSkills
        ) {

            const id =
                Number(
                    skill.skill_id
                );

            const original =
                originalMap.get(id);

            const changed =
                !original ||
                original.proficiency !==
                    skill.proficiency;

            if (!changed) {
                continue;
            }

            const response =
                await authenticatedFetch(
                    "/api/profile/skills",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                skill_id:
                                    id,

                                proficiency:
                                    skill.proficiency

                            })
                    }
                );

            if (
                response.status === 401
            ) {

                logout();
                return;

            }

            if (!response.ok) {

                throw new Error(
                    "Changes failed."
                );

            }

        }


        // ---------------------------------------------
        // SAVE LANGUAGES
        // ---------------------------------------------

        const languageResponse =
            await authenticatedFetch(
                "/api/profile/languages",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            languages:
                                currentLanguages
                        })
                }
            );

        if (
            languageResponse.status === 401
        ) {

            logout();
            return;

        }

        if (!languageResponse.ok) {

            throw new Error(
                "Changes failed."
            );

        }


        // ---------------------------------------------
        // RELOAD DATABASE VERSION
        // ---------------------------------------------

        await loadProfile();


        skillsEditing =
            false;


        setFieldsEditable(
            [
                skillSelect,
                proficiencySelect,
                addSkillBtn,
                otherSkillInput,
                languageSelect,
                otherLanguageInput,
                languageProficiencySelect,
                addLanguageBtn
            ],
            false
        );


        setEditModeButtons(
            skillsEditBtn,
            skillsSaveBtn,
            skillsCancelBtn,
            false
        );


        otherSkillInput.classList.add(
            "hidden"
        );

        otherSkillInput.value =
            "";

        otherSkillInput.disabled =
            true;


        otherLanguageInput.classList.add(
            "hidden"
        );

        otherLanguageInput.value =
            "";

        otherLanguageInput.disabled =
            true;


        // =============================================
        // ONLY FINAL SUCCESS MESSAGE
        // =============================================

        showTemporaryMessage(
            languageMessage,
            "Changes saved successfully ✓",
            "#10b981"
        );

    }
    catch (error) {

        console.error(
            "Save skills/languages error:",
            error
        );


        // =============================================
        // ONLY FINAL FAILURE MESSAGE
        // =============================================

        showTemporaryMessage(
            languageMessage,
            "Changes failed.",
            "#ef4444"
        );

    }
}


// =====================================================
// CANCEL SKILLS / LANGUAGES
// =====================================================

skillsCancelBtn.addEventListener(
    "click",
    function () {

        currentSkills =
            JSON.parse(
                JSON.stringify(
                    originalSkills
                )
            );

        currentLanguages =
            JSON.parse(
                JSON.stringify(
                    originalLanguages
                )
            );

        skillsEditing =
            false;

        setFieldsEditable(
            [
                skillSelect,
                proficiencySelect,
                addSkillBtn,
                otherSkillInput,
                languageSelect,
                otherLanguageInput,
                languageProficiencySelect,
                addLanguageBtn
            ],
            false
        );

        setEditModeButtons(
            skillsEditBtn,
            skillsSaveBtn,
            skillsCancelBtn,
            false
        );

        renderSkills(
            currentSkills
        );

        renderLanguages(
            currentLanguages
        );

        otherSkillInput.classList.add(
            "hidden"
        );

        otherSkillInput.value =
            "";

        otherSkillInput.disabled =
            true;

        otherLanguageInput.classList.add(
            "hidden"
        );

        otherLanguageInput.value =
            "";

        otherLanguageInput.disabled =
            true;

        showTemporaryMessage(
            skillMessage,
            "Changes discarded.",
            "#64748b"
        );

    }
);


// =====================================================
// ESCAPE HTML
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
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "student_id"
    );

    localStorage.removeItem(
        "full_name"
    );

    window.location.href =
        "/pages/auth/auth.html?mode=login";
}


logoutBtn.addEventListener(
    "click",
    logout
);


// =====================================================
// INITIAL LOAD
// =====================================================

loadAvailableSkills();

loadProfile();

loadSectionFromHash();