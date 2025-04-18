const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const cityInput = document.getElementById('city');
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
    const userEmail = session.user.email;

    // Step 1: Fetch the user's account type from 'table2'
    const { data: userData, error: fetchError } = await supabase
        .from('table2')
        .select('accountType')
        .eq('email', userEmail)
        .single();

    // Step 2: Handle errors or missing user data
    if (fetchError) {
        console.log('Error fetching user data: ', fetchError);
        errorMsg.textContent = "Error fetching user data.";
        return;
    }
    if (!userData) {
        errorMsg.textContent = "User not found.";
        return;
    }

    const accountType = userData.accountType;
    let updates;

    // Step 3: Define updates based on account type
    if (accountType === "Borrower Account") {
        updates = {
            firstname: firstNameInput.value,
            lastname: lastNameInput.value,
            city: cityInput.value,
        };
    } else if (accountType === "Library Account") {
        updates = {
            firstname: firstNameInput.value,
            lastname: lastNameInput.value,
            city: cityInput.value,
            libraryName: document.getElementById('library-name')?.value || '',
        };
    } else {
        errorMsg.textContent = "Invalid account type.";
        return;
    }

    // Step 4: Perform the update
    const { data, error } = await supabase
        .from('table2')
        .update(updates)
        .eq('email', userEmail);

    // Step 5: Handle the update result
    if (error) {
        console.log('Error updating user data: ', error);
        errorMsg.textContent = "Error updating profile.";
        return;
    }

    console.log('Update result: ', data);
    errorMsg.textContent = "Profile updated successfully!";
}

// Update event listener to handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('updateProfileForm');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const session = await getSession();
            if (session) {
                await updateUserProfile(session);
            } else {
                errorMsg.textContent = "No active session. Please log in.";
            }
        });
    }
});