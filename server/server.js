import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors());

mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`listening on port ${process.env.PORT}`);
      console.log("Connected to Database");
    });
  })
  .catch((error) => {
    console.log(error);
  });

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
});

const UserModel = mongoose.model("User", UserSchema);

app.post("/api/signup", async (req, res) => {
  const { username, password, type } = req.body;

  try {
    const existingUser = await UserModel.findOne({
      username,
      role: type.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists. Please choose a different username.",
      });
    }

    const newUser = new UserModel({
      username,
      password,
      role: type.toLowerCase(),
    });

    await newUser.save();

    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({
      error: "An error occurred during signup. Please try again later.",
    });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await UserModel.findOne({ username, role });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (user.password === password) {
      res.status(200).json({ message: "Login successful!" });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      error: "An error occurred during login. Please try again later.",
    });
  }
});

app.post("/api/logout", (req, res) => {
  res.status(200).json({ message: "Logout successful!" });
});

const DishSchema = new mongoose.Schema({
  name: String,
  price: Number,
  rating: { type: Number, default: 0 },
  numRatings: { type: Number, default: 0 },
});

const DishModel = mongoose.model("Dish", DishSchema);

app.post("/api/add-dish", async (req, res) => {
  const { name, price } = req.body;

  try {
    const newDish = new DishModel({
      name,
      price,
    });

    await newDish.save();

    res.status(201).json({ message: "Dish added successfully!" });
  } catch (error) {
    console.error("Error during adding dish:", error);
    res.status(500).json({
      error: "An error occurred during adding dish. Please try again later.",
    });
  }
});

app.get("/api/menu", async (req, res) => {
  try {
    const menu = await DishModel.find({}, { _id: 0, __v: 0 });
    res.status(200).json(menu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the menu." });
  }
});

app.get("/api/view-chefs", async (req, res) => {
  try {
    const chefs = await UserModel.find({ role: "chef" });

    res.status(200).json({ chefs });
  } catch (error) {
    console.error("Error fetching chefs:", error);
    res.status(500).json({ error: "An error occurred while fetching chefs." });
  }
});

const orderSchema = new mongoose.Schema({
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  orderedBy: String,
  chef: String,
  status: { type: String, default: "pending" },
});
const OrderModel = mongoose.model("Order", orderSchema);

app.post("/api/place-order", async (req, res) => {
  try {
    const { items, orderedBy } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderedBy)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const existingUser = await UserModel.findOne({
      username: orderedBy,
      role: "customer",
    });
    if (!existingUser) {
      return res
        .status(400)
        .json({ error: "Customer does not exist with the provided email." });
    }

    const chefs = await UserModel.find({ role: "chef" });
    const randomChef = chefs[Math.floor(Math.random() * chefs.length)].username;

    const newOrder = new OrderModel({
      items,
      orderedBy,
      chef: randomChef,
    });

    await newOrder.save();

    res.status(201).json({ message: "Order placed successfully!" });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({
      error:
        "An error occurred during order placement. Please try again later.",
    });
  }
});

app.post("/api/get-dish", async (req, res) => {
  const { dishName } = req.body;

  try {
    const existingDish = await DishModel.findOne({ name: dishName });

    res.json({ exists: !!existingDish });
  } catch (error) {
    console.error("Error checking dish existence:", error);
    res
      .status(500)
      .json({ error: "An error occurred while checking dish existence." });
  }
});

app.post("/api/update-rating", async (req, res) => {
  const { dishName, rating } = req.body;
  try {
    const dish = await DishModel.findOne({ name: dishName });
    if (!dish) {
      return res.status(404).json({ error: "Dish not found" });
    }

    const newRating =
      (dish.rating * dish.numRatings + rating) / (dish.numRatings + 1);

    const updatedDish = await DishModel.findOneAndUpdate(
      { name: dishName },
      {
        rating: newRating,
        numRatings: dish.numRatings + 1,
      },
      { new: true }
    );

    res.json({ message: "Rating updated successfully", updatedDish });
  } catch (error) {
    console.error("Error updating rating:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the rating." });
  }
});
app.get("/api/view-orders", async (req, res) => {
  const { email } = req.query;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const existingUser = await UserModel.findOne({
      username: email,
      role: "customer",
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ error: "Customer not found with the provided email." });
    }

    const pendingOrders = await OrderModel.find({
      orderedBy: email,
      status: "pending",
    });

    res.status(200).json(pendingOrders);
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching pending orders." });
  }
});

app.put("/api/cancel-order", async (req, res) => {
  try {
    const { email, orderId } = req.query;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const existingUser = await UserModel.findOne({
      username: email,
      role: "customer",
    });
    if (!existingUser) {
      return res
        .status(400)
        .json({ error: "Customer does not exist with the provided email." });
    }

    const existingOrder = await OrderModel.findOne({
      _id: orderId,
      status: "pending",
      orderedBy: email,
    });
    if (!existingOrder) {
      return res
        .status(404)
        .json({ error: "Order not found or cannot be cancelled." });
    }

    await OrderModel.findByIdAndUpdate(existingOrder._id, {
      status: "cancelled",
    });

    res.status(200).json({ message: "Order cancelled successfully!" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      error:
        "An error occurred during order cancellation. Please try again later.",
    });
  }
});

app.get("/api/view-orders", async (req, res) => {
  try {
    const { email } = req.query;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const existingUser = await UserModel.findOne({
      username: email,
      role: "customer",
    });
    if (!existingUser) {
      return res
        .status(400)
        .json({ error: "Customer does not exist with the provided email." });
    }

    const pendingOrders = await OrderModel.find({
      orderedBy: email,
      status: "pending",
    });

    res.status(200).json(pendingOrders);
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    res.status(500).json({
      error:
        "An error occurred while fetching pending orders. Please try again later.",
    });
  }
});

app.post("/api/authenticate-user", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await UserModel.findOne({ username: email, role });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (user.password === password) {
      res.status(200).json({ message: "Authentication successful!" });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).json({
      error: "An error occurred during authentication. Please try again later.",
    });
  }
});

app.put("/api/change-password", async (req, res) => {
  const { email, newPassword, role } = req.body;

  try {
    const user = await UserModel.findOne({ username: email, role });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or role" });
    }

    await UserModel.findOneAndUpdate(
      { username: email, role },
      {
        password: newPassword,
      }
    );

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ error: "An error occurred while changing the password." });
  }
});

app.get("/api/search-dish", async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm;

    const searchResults = await DishModel.find({ name: searchTerm });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error("Error during dish search:", error);
    res.status(500).json({ error: "An error occurred during dish search." });
  }
});

app.post("/api/fire-chef", async (req, res) => {
  try {
    const { chefEmail } = req.body;

    const chef = await UserModel.findOne({ username: chefEmail, role: "chef" });

    if (!chef) {
      return res.status(404).json({ error: "Chef not found" });
    }

    const orders = await OrderModel.find({
      chef: chefEmail,
      status: "pending",
    });

    if (orders.length > 0) {
      const chefs = await UserModel.find({
        role: "chef",
        username: { $ne: chefEmail },
      });
      const randomChef =
        chefs[Math.floor(Math.random() * chefs.length)].username;

      await OrderModel.updateMany(
        { chef: chefEmail, status: "pending" },
        { chef: randomChef, status: "pending" }
      );
    }

    await UserModel.findOneAndDelete({ username: chefEmail, role: "chef" });

    res.status(200).json({ message: "Chef fired successfully" });
  } catch (error) {
    console.error("Error firing chef:", error);
    res.status(500).json({ error: "An error occurred while firing chef." });
  }
});

app.post("/api/check-dish", async (req, res) => {
  try {
    const { dishName } = req.body;

    const existingDish = await DishModel.findOne({ name: dishName });

    res.status(200).json({ exists: !!existingDish });
  } catch (error) {
    console.error("Error checking dish existence:", error);
    res
      .status(500)
      .json({ error: "An error occurred during dish existence check." });
  }
});

app.post("/api/remove-dish", async (req, res) => {
  try {
    const { dishName } = req.body;

    const existingDish = await DishModel.findOne({ name: dishName });

    if (!existingDish) {
      return res.status(404).json({ error: "Dish not found" });
    }

    await DishModel.deleteOne({ name: dishName });

    res.status(200).json({ message: "Dish removed successfully!" });
  } catch (error) {
    console.error("Error removing dish:", error);
    res.status(500).json({ error: "An error occurred during dish removal." });
  }
});

app.get("/api/get-pending-orders", async (req, res) => {
  try {
    const pendingOrders = await OrderModel.find({ status: "pending" });

    res.status(200).json({ pendingOrders });
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching pending orders." });
  }
});

app.get("/api/chef/orders", async (req, res) => {
  try {
    const chefEmail = req.query.email;

    const assignedOrders = await OrderModel.find({
      chef: chefEmail,
      status: "pending",
    });

    res.status(200).json({ orders: assignedOrders });
  } catch (error) {
    console.error("Error fetching assigned orders for chef:", error);
    res
      .status(500)
      .json({ error: "An error occurred during fetching assigned orders." });
  }
});

app.post("/api/resign-chef", async (req, res) => {
  try {
    const { chefEmail } = req.body;

    const deletedChef = await UserModel.findOneAndDelete({
      username: chefEmail,
      role: "chef",
    });

    if (!deletedChef) {
      return res.status(404).json({ error: "Chef not found" });
    }

    await OrderModel.updateMany(
      { chef: chefEmail, status: { $ne: "pending" } },
      { $set: { status: "cancelled" } }
    );

    res.status(200).json({ message: "Resignation successful!" });
  } catch (error) {
    console.error("Error during resignation:", error);
    res.status(500).json({ error: "An error occurred during resignation." });
  }
});

app.get("/api/get-chef-orders", async (req, res) => {
  try {
    const { email } = req.query;

    const chefOrders = await OrderModel.find({
      chef: email,
      status: "pending",
    });
    res.status(200).json({ chefOrders });
  } catch (error) {
    console.error("Error getting chef orders:", error);
    res
      .status(500)
      .json({ error: "An error occurred while getting chef orders." });
  }
});

app.post("/api/update-order-status", async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating order status." });
  }
});
