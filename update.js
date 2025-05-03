const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

// Input elements
const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const cityInput = document.getElementById('city');
const errorMsg = document.getElementById('error-msg');

async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    return error ? null : data.session;
}

async function updateUserProfile(session) {
    const userEmail = session.user.email;
    errorMsg.textContent = "";

    // Fetch account type
    const { data: userData, error: fetchError } = await supabase
        .from('table2')
        .select('accountType')
        .eq('email', userEmail)
        .single();

    if (fetchError || !userData) {
        errorMsg.textContent = "User not found or error fetching data.";
        return;
    }

    const accountType = userData.accountType;
    let updates = {};

    // Define updates based on account type
    if (accountType === "Borrower Account") {
        updates = {
            firstname: firstNameInput.value.trim(),
            lastname: lastNameInput.value.trim(),
            city: cityInput.value.trim(),
        };
    } else if (accountType === "Library Account") {
        const libraryNameInput = document.getElementById('library-name');
        const libraryName = libraryNameInput.value.trim();
        if (!libraryName) {
            errorMsg.textContent = "Library Name is required.";
            return;
        }
        updates = {
            firstname: firstNameInput.value.trim(),
            lastname: lastNameInput.value.trim(),
            city: cityInput.value.trim(),
            libraryName: libraryName,
        };
    } else {
        errorMsg.textContent = "Invalid account type.";
        return;
    }

    // Update the database
    const { error } = await supabase
        .from('table2')
        .update(updates)
        .eq('email', userEmail);

    if (error) {
        errorMsg.textContent = error.message;
    } else {
        errorMsg.style.color = "#2e7d32";
        errorMsg.textContent = "Profile updated successfully!";
    }
}

// Form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('updateProfileForm');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const session = await getSession();
        session ? await updateUserProfile(session) : alert("Please log in.");
    });
});