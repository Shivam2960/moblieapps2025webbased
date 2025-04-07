const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

const updateButton = document.getElementById('update-btn');
const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const cityInput = document.getElementById('city');
const libraryNameInput = document.getElementById('library-name'); // New input field
const errorMsg = document.getElementById('error-msg');

async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.log('Error fetching session: ', error);
        return null;
    }
    return data.session;
}

async function updateUserProfile(session) {
    const userEmail = session.user.email; // Identify the user by email

    const updates = {
        firstname: firstNameInput.value,
        lastname: lastNameInput.value,
        city: cityInput.value,
        libraryName: libraryNameInput.value, // Add library name to update
    };

    const { data, error } = await supabase
        .from('table2') // Ensure this matches your actual table name
        .update(updates)
        .eq('email', userEmail);

    if (error) {
        console.log('Error updating user data: ', error);
        errorMsg.innerHTML = "Error updating profile.";
        return;
    }

    console.log('Update result: ', data);
    errorMsg.innerHTML = "Profile updated successfully!";
}

updateButton.addEventListener('click', async () => {
    const session = await getSession();
    if (session) {
        updateUserProfile(session);
    } else {
        errorMsg.innerHTML = "No active session. Please log in.";
    }
});
