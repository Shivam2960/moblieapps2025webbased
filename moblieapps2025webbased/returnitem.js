const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

// Function to format date from YYYY-MM-DD to MM-DD-YYYY
function formatDateToMMDDYYYY(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${month}-${day}-${year}`;
}

// Function to return an item
async function returnItem() {
    // Debug element existence
    const itemNameElement = document.getElementById("itemNameReturn");
    const dueDateElement = document.getElementById("dueDateReturn");
    const personNameElement = document.getElementById("personNameReturn");
    const phoneNumberElement = document.getElementById("phoneNumberReturn");
    const errorMsgElement = document.getElementById("error-msg");

    console.log("itemNameReturn:", itemNameElement);
    console.log("dueDateReturn:", dueDateElement);
    console.log("personNameReturn:", personNameElement);
    console.log("phoneNumberReturn:", phoneNumberElement);
    console.log("error-msg:", errorMsgElement);

    if (!itemNameElement || !dueDateElement || !personNameElement || !phoneNumberElement || !errorMsgElement) {
        console.error("One or more elements not found in the DOM.");
        return;
    }

    const itemName = itemNameElement.value.trim();
    const dueDate = dueDateElement.value.trim();
    const personName = personNameElement.value.trim();
    const phoneNumber = phoneNumberElement.value.trim();
    const errorMsg = errorMsgElement;

    if (!itemName || !dueDate || !personName || !phoneNumber) {
        errorMsg.textContent = "Please fill out all fields.";
        return;
    }

    errorMsg.textContent = ""; // Clear previous error message

    // Format the due date to match borrowed_info format (MM-DD-YYYY)
    const formattedDueDate = formatDateToMMDDYYYY(dueDate);
    const checkoutDetails = `${itemName} By: ${personName} Due: ${formattedDueDate} PN: ${phoneNumber}`;

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

        // Log for debugging
        console.log("Constructed checkoutDetails:", checkoutDetails);
        console.log("Current borrowed_info:", currentBorrowedItems);

        // Check if the item exists in borrowed_info
        if (!currentBorrowedItems.includes(checkoutDetails)) {
            errorMsg.textContent = "Error: Item not found in borrowed list.";
            return;
        }

        // Remove the item from borrowed_info
        currentBorrowedItems = currentBorrowedItems.filter(item => item !== checkoutDetails);

        // Add the item name back to In_Stock
        currentInStockItems.push(itemName);

        // Update Supabase
        const { error: updateError } = await supabase
            .from("table2")
            .update({ In_Stock: currentInStockItems, borrowed_info: currentBorrowedItems })
            .eq("id", libraryId);

        if (updateError) throw updateError;

        // Clear input fields
        itemNameElement.value = "";
        dueDateElement.value = "";
        personNameElement.value = "";
        phoneNumberElement.value = "";

        errorMsg.textContent = "Item successfully returned!";
    } catch (err) {
        console.error("Full error:", err);
        errorMsg.textContent = `Error: ${err.message}`;
    }
}

// Ensure DOM is loaded before attaching event listener
document.addEventListener("DOMContentLoaded", () => {
    const returnButton = document.getElementById("returnBtn"); // Adjust this ID based on your HTML
    if (returnButton) {
        returnButton.addEventListener("click", returnItem);
    } else {
        console.error("Button with ID 'returnBtn' not found in the DOM.");
    }
});