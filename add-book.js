const { createClient } = window.supabase;
const supabase = createClient(
    "https://jidvjencxztuercjskgw.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU"
);

async function addBook(event) {
    event.preventDefault(); // Prevent default form submission

    const title = document.getElementById('bookTitle').value.trim();
    const dueDateInput = document.getElementById('dueDate').value.trim();
    const errorMsg = document.getElementById('error-msg');
    errorMsg.style.color = "#d32f2f"; // Red color for errors

    if (!title || !dueDateInput) {
        errorMsg.textContent = 'Both book title and due date are required';
        return;
    }

    // Format the date from YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = dueDateInput.split('-');
    const formattedDate = `${month}/${day}/${year}`;
    const newEntry = `${title} Due: ${formattedDate}`;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        errorMsg.textContent = 'Please log in to add books';
        return;
    }

    // Get current borrowed books
    const { data, error } = await supabase.from('table2')
        .select('Borrowed_Books_Borrower')
        .eq('id', user.id)
        .single();

    if (error && error.code !== "PGRST116") { // Ignore "no rows found" error
        errorMsg.textContent = 'Error loading your borrowed books';
        return;
    }

    // Check for duplicates
    const currentBooks = data?.Borrowed_Books_Borrower || [];
    const isDuplicate = currentBooks.some(entry => {
        // Extract book title and due date from existing entry
        const [existingTitle, existingDuePart] = entry.split(' Due: ');
        return existingTitle === title && existingDuePart === formattedDate;
    });

    if (isDuplicate) {
        errorMsg.innerHTML = `
            "${title}" with due date ${formattedDate} is already in your borrowed books.
        `;
        return;
    }

    // Add the new book
    const updatedBooks = [...currentBooks, newEntry];

    const { error: updateError } = await supabase.from('table2')
        .upsert({
            id: user.id,
            Borrowed_Books_Borrower: updatedBooks
        });

    if (updateError) {
        errorMsg.textContent = 'Error adding book to your collection';
    } else {
        // Clear form and show success message
        document.getElementById('bookTitle').value = '';
        document.getElementById('dueDate').value = '';
        errorMsg.style.color = "#2e7d32"; // Green for success
        errorMsg.innerHTML = `
            "${title}" with due date ${formattedDate} has been added successfully!
        `;
    }
}

// Add event listener to the form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addBookForm');
    if (form) {
        form.addEventListener('submit', addBook);
    }
});