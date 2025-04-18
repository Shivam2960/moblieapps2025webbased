const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

async function populateDropdown() {
    const select = document.getElementById("removeitemname");
    select.innerHTML = '<option value="">Select a book to remove</option>'; // Reset with default

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("Library_Stock")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const libraryStock = data.Library_Stock || [];

        // Add books if available
        if (libraryStock.length > 0) {
            const uniqueBooks = [...new Set(libraryStock)];
            uniqueBooks.forEach(book => {
                const option = document.createElement("option");
                option.value = book;
                option.textContent = book;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error populating dropdown:", err);
        document.getElementById("error-msg").textContent = `Error loading books: ${err.message}`;
    }
}

// Remove item function with dropdown refresh
async function removeItemFromLibrary() {
    const bookName = document.getElementById("removeitemname").value.trim();
    const errorMsg = document.getElementById("error-msg");

    if (!bookName) {
        errorMsg.textContent = "Please select a book from the dropdown.";
        return;
    }

    errorMsg.textContent = "";

    try {
        // Existing removal logic
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("id, Library_Stock, In_Stock, borrowed_info")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const libraryId = data.id;
        const currentLibraryStock = data.Library_Stock || [];
        const currentInStock = data.In_Stock || [];
        const currentBorrowedInfo = data.borrowed_info || [];

        // Update arrays
        const updatedLibraryStock = currentLibraryStock.filter(item => item !== bookName);
        const updatedInStock = currentInStock.filter(item => item !== bookName);
        const updatedBorrowedInfo = currentBorrowedInfo.filter(entry => !entry.startsWith(bookName));

        // Update Supabase
        const { error: updateError } = await supabase
            .from("table2")
            .update({
                Library_Stock: updatedLibraryStock,
                In_Stock: updatedInStock,
                borrowed_info: updatedBorrowedInfo
            })
            .eq("id", libraryId);

        if (updateError) throw updateError;

        // Refresh dropdown and clear selection
        errorMsg.textContent = "Book removed successfully from all records!";
        await populateDropdown();
    } catch (err) {
        console.error("Error:", err);
        errorMsg.textContent = `Error: ${err.message}`;
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("removeitembtn").addEventListener("click", removeItemFromLibrary);
    populateDropdown();
});