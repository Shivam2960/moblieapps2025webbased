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

    if (!title || !dueDateInput) {
        errorMsg.textContent = 'Both fields are required';
        return;
    }

    const [year, month, day] = dueDateInput.split('-');
    const formattedDate = `${month}/${day}/${year}`;
    const newEntry = `${title} Due: ${formattedDate}`;

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        errorMsg.textContent = 'Not logged in';
        return;
    }

    const { data, error } = await supabase.from('table2')
        .select('Borrowed_Books_Borrower')
        .eq('id', user.id)
        .single();

    if (error) {
        errorMsg.textContent = 'Error loading books';
        return;
    }

    const updatedBooks = [...(data.Borrowed_Books_Borrower || []), newEntry];

    const { error: updateError } = await supabase.from('table2')
        .update({ Borrowed_Books_Borrower: updatedBooks })
        .eq('id', user.id);

    if (updateError) {
        errorMsg.textContent = 'Error adding book';
    } else {
        document.getElementById('bookTitle').value = '';
        document.getElementById('dueDate').value = '';
        errorMsg.textContent = 'Book added successfully!';
    }
}

// Add event listener to the form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addBookForm');
    if (form) {
        form.addEventListener('submit', addBook);
    }
});