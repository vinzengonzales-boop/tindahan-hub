# Tindahan Hub

Build a Complete Sari-Sari Store Management Website

Act as a professional web developer and UI/UX designer. Create a complete, functional, mobile-responsive website called Sari-Sari Manager — Simple Store Management System for a small sari-sari store in the Philippines.

This is a college IT project intended to help a traditional sari-sari store improve its daily operations by replacing paper-based records with a simple digital management system.

Do not create only a landing page, static mockup, or visual demonstration. Build an actual working application with functional buttons, forms, calculations, navigation, and persistent data.

1. Project Background

The sari-sari store currently records daily sales, expenses, inventory, and customer debts (utang) in a physical notebook.

The store experiences these problems:

Sales and inventory updates are sometimes forgotten during busy hours.

Popular products, especially canned goods and drinks, can run out of stock without being noticed.

Customer debts and payments are difficult to track consistently.

Calculating and checking remaining customer balances takes time.

The owner primarily uses a smartphone and experiences unreliable internet connectivity.

Business records need to be protected from unauthorized access.

The website must address these problems through a simple and practical management system.

2. Design and Appearance

Create a modern, professional, clean interface suitable for an actual neighborhood sari-sari store.

Design requirements:

Application name: Sari-Sari Manager.

Use a green, white, and light gray color palette.

Use a simple, readable font and clear icons.

Make the website mobile-first and responsive on phones, tablets, and desktop computers.

Use a sidebar on desktop and a suitable mobile navigation menu.

Include a consistent header with the application name and current page.

Use dashboard cards, clear tables, search bars, and simple forms.

Use Philippine pesos (₱) and display monetary values to two decimal places.

Use clear status labels for low stock, out of stock, unpaid, partially paid, and paid.

Provide confirmation dialogs before deleting important records.

Show success messages after successful operations and useful error messages when something fails.

Include empty states when no records exist.

Avoid excessive animations, unnecessary decorations, and complicated layouts.

The interface should be easy enough for a store owner with limited technical experience to understand.

3. Dashboard

Create a dashboard that displays the following information using actual stored records:

Today's total sales.

Total number of products.

Number of low-stock products.

Total outstanding customer utang.

Recent sales transactions.

Products that need restocking.

Quick-action buttons for New Sale, Manage Inventory, Record Utang, and View Sales History.

Dashboard totals must update automatically whenever a relevant transaction or record changes. Do not hardcode the statistics.

4. Inventory Management

Build a functional inventory management page.

Required features:

Display all products in a searchable, filterable list.

Add new products.

Edit existing products.

Delete products with confirmation.

Update stock quantities.

Update product names, categories, selling prices, and stock quantities.

Display product name, category, selling price, available quantity, and stock status.

Identify low-stock and out-of-stock products automatically.

Allow searching by product name.

Filter products by category and stock status.

Allow the store owner to set a low-stock threshold.

Prevent stock quantities from becoming negative.

Include the following initial sample products:

ProductCategoryPriceInitial StockCoke 1.5 LBeverages₱73.0067Royal 1.5 LBeverages₱73.0016Sprite 1.5 LBeverages₱73.006Mountain Dew 1.5 LBeverages₱73.0069

Add other clearly identified sample products under categories such as:

Beverages

Canned goods

Snacks

Instant noodles

Household supplies

Personal care products

Allow all sample products, prices, and quantities to be edited.

5. Point-of-Sale and Sales Transactions

Create a functional point-of-sale page for recording customer purchases.

Required features:

Search and browse available products.

Select products and enter quantities.

Add multiple products to a shopping cart.

Increase or decrease item quantities.

Remove items from the cart.

Automatically calculate each item's subtotal.

Automatically calculate the total amount due.

Accept cash payments.

Allow the owner to enter the amount received.

Calculate the change automatically.

Prevent checkout if the payment is insufficient.

Prevent selling more units than are available.

Save completed transactions with a unique transaction ID, date, time, purchased items, quantities, and total.

Deduct sold quantities from inventory after successful checkout.

Provide a printable receipt.

Clear the cart after a successful sale.

Do not save cancelled or incomplete transactions as completed sales.

For each completed transaction, ensure the sale record and inventory deduction remain consistent. If checkout fails, do not partially deduct stock or save an incomplete sale.

6. Customer and Utang Management

Create a dedicated page for managing customers and their outstanding debts.

Required features:

Add customers using their names or nicknames.

Record new debts.

Record the date and description of each debt.

Record the original amount owed.

Record full or partial payments.

Calculate the remaining balance automatically.

Display the total outstanding debt per customer.

Show individual debt and payment histories.

Search customers by name.

Display statuses: Unpaid, Partially Paid, and Paid.

Allow the owner to view the customer's transaction history.

Prevent payments from exceeding the remaining balance unless an explicit refund or adjustment workflow is implemented.

Keep payment history instead of simply overwriting previous balances.

Require confirmation for destructive actions.

Include these initial sample records:

CustomerOriginal DebtDateStatusCustomer A₱150.00October 1, 2026UnpaidCustomer B₱250.00October 5, 2026PaidCustomer C₱75.00October 8, 2026Unpaid

For Customer B, create a corresponding payment record for the full ₱250.00. Do not simply label the debt as paid without recording the payment.

Keep customer debt information private and accessible only through the management interface.

7. Sales History and Reports

Create a sales history page with:

Unique transaction ID.

Transaction date and time.

Purchased products.

Item quantities.

Total amount.

Payment method.

Transaction details.

Printable receipt.

Include:

Search by transaction ID.

Filter by date or date range.

Calculate total sales for a selected period.

Calculate the number of completed transactions.

Identify best-selling products using actual transaction records.

Display low-stock products.

Display total outstanding customer debt.

All reports must be based on saved data and reflect changes immediately.

Clearly distinguish sales revenue from profit. Do not claim to calculate true profit unless product costs and other relevant expenses are included.

8. Expense Management

Create an expense tracking page because the store currently records business expenses in a notebook.

Required features:

Add an expense description.

Enter the amount.

Select an expense category.

Record the date.

View, edit, and delete expenses.

Search and filter expense records.

Calculate total expenses for a selected period.

Keep expenses separate from sales transactions.

If you show a net-income estimate, explain how it is calculated and do not label it as true profit without sufficient cost information.

9. Settings and Data Backup

Create a settings page with:

Store name configuration.

Low-stock threshold settings.

Currency display settings, defaulting to Philippine pesos.

Data export and backup.

Data restoration, if supported.

Allow important records to be exported to CSV or JSON where appropriate.

Before restoring a backup or replacing existing records, show a confirmation and validate the imported data. Avoid accidental data loss.

10. Offline Functionality

The owner may experience unreliable internet connectivity, so offline use is an important consideration.

Requirements:

Make the interface mobile-friendly.

Use browser local storage or IndexedDB for a standalone prototype.

Ensure saved records persist after refreshing or reopening the application in the same browser.

Support offline access to the application after it has been loaded, if technically feasible.

If supported by the platform, implement Progressive Web App (PWA) features.

Explain which functions are available offline and any limitations.

Provide a reliable way to back up important records.

Do not claim that local browser storage synchronizes data between devices automatically.

If the application uses a backend database, explain the internet requirements and how offline transactions are handled. Avoid unnecessary paid services.

11. Login and Data Privacy

If supported by the chosen platform, implement an owner login and restrict access to management pages.

Requirements:

Do not expose customer names, debts, or payment histories on public pages.

Do not store passwords as plain text.

Validate all user inputs.

Protect private management features.

Avoid exposing sensitive customer information in URLs or publicly accessible reports.

Explain any security limitations if the website uses only client-side storage.

A simple client-side password screen must not be presented as full security for sensitive business data.

12. Website Navigation

Include these main sections:

Dashboard

New Sale / Point of Sale

Inventory Management

Customers and Utang

Sales History

Expense Management

Reports

Settings and Backup

Every navigation item and visible button must perform its intended action. Do not create nonfunctional buttons, fake links, or forms that do not save data.

13. Technical Requirements

Use HTML, CSS, and JavaScript for a standalone website, unless the platform requires a different stack.

If using a framework, keep the implementation organized and maintainable.

Use reusable functions for calculations, validation, record management, and inventory updates.

Keep the source code readable for first-year IT students.

Avoid unnecessary dependencies, paid APIs, and overly complicated architecture.

Use semantic HTML and accessible form labels.

Ensure keyboard-friendly controls and readable color contrast.

Test the application in modern browsers, including Chrome and Microsoft Edge.

Ensure responsive behavior on smartphones and desktop computers.

Handle empty inputs, invalid numbers, insufficient payment, insufficient stock, and duplicate submissions appropriately.

14. Testing Requirements

Before declaring the application complete, verify that:

A new product can be added and appears in inventory.

Existing product details can be edited.

Product quantities and stock statuses update correctly.

A sale calculates the correct total, payment, and change.

A completed sale deducts the correct quantity from inventory.

A sale cannot be completed with insufficient payment.

A sale cannot be completed when stock is insufficient.

Saved records persist after refreshing the browser.

A new customer debt increases the customer's outstanding balance.

Partial payments update the remaining balance correctly.

Full payment changes the debt status to Paid.

Sales and expense filters return the correct records.

Reports reflect the actual saved transactions.

Data export works and contains the appropriate records.

The layout works on mobile and desktop.

Invalid inputs and destructive actions are handled appropriately.

Supported offline functions work without an internet connection after initial loading.

Fix any discovered errors before presenting the finished application.

15. Final Deliverables

Provide:

A complete working website.

All required source code and project files.

A clear project folder structure.

Instructions for running the website.

Instructions for modifying sample products and prices.

Instructions for backing up and restoring records.

A list of completed features and known limitations.

A short checklist for testing the main workflows.

Do not omit required files or replace important functionality with comments such as "implement this later." If a feature cannot be implemented by the platform, state the limitation clearly.

Final Instruction

Build Sari-Sari Manager as a practical digital management system that solves the store's actual problems: missed sales entries, poor inventory monitoring, inconsistent utang records, manual expense tracking, unreliable connectivity, and the need for safer recordkeeping.

Prioritize accurate calculations, reliable data handling, simplicity, mobile usability, and working features over decorative effects.

Start implementing the application now. Do not respond with only a plan or explanation. Produce the actual working website and verify its core features before declaring it finished.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f3740c29-0460-5a86-976c-cba3178541c0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
