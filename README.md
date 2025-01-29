# Restaurant-Management-System


## Overview
This project is a restaurant management system built using Node.js, Express, and MongoDB. It allows customers to place orders, chefs to manage their assigned orders, and administrators to manage the menu and staff.

## Features

### Actors
- **Customer**
- **Chef**
- **Admin/Manager**

### Common Use Cases
- **Menu Management**: View the available menu.
- **Change Password**: Customers and chefs can update their passwords.

### Customer Use Cases
- **Search for Dish**: Customers can search for dishes in the menu.
- **Place Order**: Customers can place orders and select dishes and quantities; chefs are assigned randomly.
- **Give Ratings**: Customers can rate dishes, updating the dish's average rating.
- **View Pending Orders**: Customers can check the status of their orders.
- **Cancel Order**: Customers can cancel pending orders.

### Chef Use Cases
- **View Assigned Orders**: Chefs can view pending orders assigned to them.
- **Update Order Status**: Mark orders as "completed."
- **Resign**: Chefs can resign, and their accounts will be removed from the system.

### Admin Use Cases
- **Manage Chefs**: Admins can add and remove chefs.
- **Manage Dishes**: Admins can add or remove dishes.
- **View Chefs**: Admins can see all employed chefs.
- **View Pending Orders**: Admins can check all pending orders.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Custom authentication (JWT can be integrated for security)
- **API Framework**: REST API



## API Endpoints
### Authentication
- `POST /api/signup` - Create a new user (customer or chef)
- `POST /api/login` - Log in with username and password
- `POST /api/logout` - Log out

### Menu Management
- `POST /api/add-dish` - Admin can add a new dish
- `GET /api/menu` - View all available dishes

### Orders
- `POST /api/place-order` - Customers can place an order
- `GET /api/view-orders?email=<customer_email>` - View pending orders for a customer
- `PUT /api/cancel-order?email=<customer_email>&orderId=<order_id>` - Cancel an order
- `POST /api/update-rating` - Update dish rating

### Chef Management
- `GET /api/view-chefs` - Admin can view all chefs



