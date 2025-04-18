// remove-book.js
const { createClient } = window.supabase;
const supabase = createClient("https://jidvjencxztuercjskgw.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU");

async function loadBooks() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('table2')
        .select('Borrowed_Books_Borrower')
        .eq('id', user.id)
        .single();

    const dropdown = document.getElementById('bookDropdown');
    dropdown.innerHTML = '<option value="">Select a book to remove</option>';

    (data.Borrowed_Books_Borrower || []).forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        dropdown.appendChild(option);
    });
}

document.getElementById('removeButton').addEventListener('click', async () => {
    const selectedBook = document.getElementById('bookDropdown').value;
    if (!selectedBook){
        document.getElementById('error-msg').textContent = 'Please select a book from the dropdown.';
        return;
    }


    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('table2')
        .select('Borrowed_Books_Borrower')
        .eq('id', user.id)
        .single();

    const updatedBooks = (data.Borrowed_Books_Borrower || []).filter(book => book !== selectedBook);

    const { error } = await supabase.from('table2')
        .update({ Borrowed_Books_Borrower: updatedBooks })
        .eq('id', user.id);

    if (!error) {
        loadBooks();
        document.getElementById('error-msg').textContent = 'Book removed successfully!';
    }
});

// Initial load
loadBooks();