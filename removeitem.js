const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

// Function to remove an item from Library_Stock, In_Stock, and borrowed_info
async function removeItemFromLibrary() {
    const bookName = document.getElementById("removeitemname").value.trim();
    const errorMsg = document.getElementById("error-msg");

    if (!bookName) {
        errorMsg.textContent = "Please enter a book name.";
        return;
    }

    errorMsg.textContent = ""; // Clear previous error message

    try {
        // Get the current user's session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        // Fetch current Library_Stock, In_Stock, and borrowed_info for the user
        const { data, error } = await supabase
            .from("table2")
            .select("id, Library_Stock, In_Stock, borrowed_info")
            .eq("id", userId) // Filter by user ID
            .single();

        if (error) throw error;

        const libraryId = data.id;
        const currentLibraryStock = data.Library_Stock || [];
        const currentInStock = data.In_Stock || [];
        const currentBorrowedInfo = data.borrowed_info || [];

        // Log data for debugging
        console.log("Library_Stock:", currentLibraryStock);
        console.log("In_Stock:", currentInStock);
        console.log("borrowed_info:", currentBorrowedInfo);

        // Check if the book exists in any of the arrays
        if (
            !currentLibraryStock.includes(bookName) &&
            !currentInStock.includes(bookName) &&
            !currentBorrowedInfo.some(entry => entry.startsWith(bookName))
        ) {
            errorMsg.textContent = "Book not found in stock or borrowed info.";
            return;
        }

        // Remove the book from Library_Stock and In_Stock
        const updatedLibraryStock = currentLibraryStock.filter(item => item !== bookName);
        const updatedInStock = currentInStock.filter(item => item !== bookName);

        // Remove the book from borrowed_info
        const updatedBorrowedInfo = currentBorrowedInfo.filter(entry => !entry.startsWith(bookName));

        // Update all three fields in Supabase
        const { data: updateData, error: updateError } = await supabase
            .from("table2")
            .update({
                Library_Stock: updatedLibraryStock,
                In_Stock: updatedInStock,
                borrowed_info: updatedBorrowedInfo
            })
            .eq("id", libraryId);

        if (updateError) throw updateError;

        // Clear input field after successful removal
        document.getElementById("removeitemname").value = "";
        errorMsg.textContent = "Book removed successfully from all records!";
    } catch (err) {
        console.error("Full error:", err);
        errorMsg.textContent = `Error: ${err.message}`;
    }
}

// Attach event listener to button
document.getElementById("removeitembtn").addEventListener("click", removeItemFromLibrary);