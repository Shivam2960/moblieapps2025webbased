const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

// Function to return an item by title
async function returnItem() {
    const itemName = document.getElementById("itemNameReturn").value.trim();
    const errorMsg = document.getElementById("error-msg");

    if (!itemName) {
        errorMsg.textContent = "Please enter the name of the item to return.";
        return;
    }

    errorMsg.textContent = ""; // Clear previous error message

    try {
        // Get the current user's session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        // Fetch current borrowed items and In_Stock for the user
        const { data, error } = await supabase
            .from("table2")
            .select("id, borrowed_info, In_Stock")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const libraryId = data.id;
        let currentBorrowedItems = data.borrowed_info || [];
        let currentInStockItems = data.In_Stock || [];

        // Find the borrowed entry that starts with the itemName
        const borrowedEntry = currentBorrowedItems.find(entry => entry.startsWith(itemName + " By:"));

        if (!borrowedEntry) {
            errorMsg.textContent = `Error: "${itemName}" is not currently borrowed.`;
            return;
        }

        // Remove the borrowed entry
        currentBorrowedItems = currentBorrowedItems.filter(entry => entry !== borrowedEntry);

        // Extract the item name from the borrowed entry
        const itemNameFromEntry = borrowedEntry.split(" By:")[0].trim();

        // Add the item back to In_Stock
        currentInStockItems.push(itemNameFromEntry);

        // Update Supabase
        const { error: updateError } = await supabase
            .from("table2")
            .update({ In_Stock: currentInStockItems, borrowed_info: currentBorrowedItems })
            .eq("id", libraryId);

        if (updateError) throw updateError;

        // Clear input field
        document.getElementById("itemNameReturn").value = "";

        errorMsg.textContent = `"${itemNameFromEntry}" has been successfully returned!`;
    } catch (err) {
        console.error("Full error:", err);
        errorMsg.textContent = `Error: ${err.message}`;
    }
}

// Attach event listener to button
document.addEventListener("DOMContentLoaded", () => {
    const returnButton = document.getElementById("returnBtn");
    if (returnButton) {
        returnButton.addEventListener("click", returnItem);
    } else {
        console.error("Return button not found in DOM.");
    }
});