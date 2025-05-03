const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

// Function to populate dropdown with In_Stock items
async function populateCheckoutDropdown() {
    const select = document.getElementById("checkoutitemname");
    select.innerHTML = '<option value="">Select an item to check out</option>'; // Reset with default

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("In_Stock")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const inStockItems = data.In_Stock || [];

        // Only populate items if available
        if (inStockItems.length > 0) {
            inStockItems.forEach(item => {
                const option = document.createElement("option");
                option.value = item;
                option.textContent = item;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error populating dropdown:", err);
        errorMsg.style.color = "#d32f2f";
        document.getElementById("error-msg").textContent = `Error loading items: ${err.message}`;
    }
}

function formatDateToMMDDYYYY(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${month}-${day}-${year}`;
}

async function checkOutItem(event) {
    if (event) event.preventDefault();

    const itemName = document.getElementById("checkoutitemname").value.trim();
    const dueDate = document.getElementById("dueDate").value.trim();
    const personName = document.getElementById("checkoutpersonname").value.trim();
    const phoneNumber = document.getElementById("checkoutpersonPN").value.trim();
    const errorMsg = document.getElementById("error-msg");

    // Validate all fields
    if (!itemName || !dueDate || !personName || !phoneNumber) {
        errorMsg.style.color = "#d32f2f";
        errorMsg.textContent = "Please fill out all fields.";
        return;
    }

    // Validate phone number format
    const formattedPN = formatPhoneNumber(phoneNumber);
    if (!formattedPN) {
        errorMsg.style.color = "#d32f2f";
        errorMsg.textContent = "Invalid phone number format. Example: 123-456-7890";
        return;
    }

    errorMsg.textContent = "";

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("id, In_Stock, borrowed_info")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const libraryId = data.id;
        let currentInStockItems = data.In_Stock || [];
        let currentBorrowedItems = data.borrowed_info || [];

        if (!currentInStockItems.includes(itemName)) {
            errorMsg.style.color = "#d32f2f";
            errorMsg.textContent = "Error: Item is no longer available.";
            return;
        }

        // Update arrays
        currentInStockItems = currentInStockItems.filter(item => item !== itemName);
        const formattedDueDate = formatDateToMMDDYYYY(dueDate);
        const checkoutDetails = `${itemName} By: ${personName} Due: ${formattedDueDate} PN: ${formattedPN}`;

// Add this line to push the new checkout details to the array
        currentBorrowedItems.push(checkoutDetails); // <--- THIS IS MISSING

// Update Supabase
        const { error: updateError } = await supabase
            .from("table2")
            .update({
                In_Stock: currentInStockItems,
                borrowed_info: currentBorrowedItems
            })
            .eq("id", libraryId);

        if (updateError) throw updateError;

        // Clear inputs and refresh dropdown
        document.getElementById("dueDate").value = "";
        document.getElementById("checkoutpersonname").value = "";
        document.getElementById("checkoutpersonPN").value = "";
        errorMsg.style.color = "#2e7d32";
        errorMsg.textContent = "Item checked out successfully!";
        await populateCheckoutDropdown();
    } catch (err) {
        console.error("Error:", err);
        errorMsg.textContent = `Error: ${err.message}`;
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById("checkoutForm");
    if (form) {
        form.addEventListener("submit", checkOutItem);
    }
    populateCheckoutDropdown();
});

function formatPhoneNumber(phoneNumberString) {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        const intlCode = match[1] ? '+1 ' : '';
        return `${intlCode}(${match[2]}) ${match[3]}-${match[4]}`;
    }
    return null;
}