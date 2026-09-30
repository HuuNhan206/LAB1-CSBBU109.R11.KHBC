// Step 1: Import modules
require('dotenv').config();
const mongoose = require('mongoose');

// Step 2: Connect to the MongoDB database
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log("-> Connected to MongoDB successfully via Mongoose ODM!"))
  .catch(err => console.error("MongoDB connection error:", err));

// Step 3: Define the Mongoose schema with validation rules
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  age: {
    type: Number,
    min: [18, 'User age must be at least 18'],
    max: [100, 'Invalid age']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Question 1: Custom validation with Regex - Vietnamese phone
  phone: {
    type: String,
    validate: {
      validator: function (v) {
        // Vietnamese phone: 10 digits, starting with 03, 05, 07, 08, or 09
        return /^(03|05|07|08|09)\d{8}$/.test(v);
      },
      message: props => `"${props.value}" is not a valid Vietnamese phone number! Must be 10 digits starting with 03, 05, 07, 08, or 09.`
    }
  },

  // Question 4: Soft delete field
  isDeleted: {
    type: Boolean,
    default: false
  },

  // Question 5: Password field (for pre-save hashing simulation)
  password: {
    type: String
  }

}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields

  // Question 2: Configure schema to include virtuals in JSON output
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Question 2: Virtual property - displayInfo
userSchema.virtual('displayInfo').get(function () {
  return `${this.fullName} <${this.email}> [${this.role.toUpperCase()}]`;
});

// Question 3: Static method - findActiveByRole(roleName)
userSchema.statics.findActiveByRole = function (roleName) {
  return this.find({ role: roleName, isActive: true, isDeleted: false })
    .sort({ fullName: 1 }); // Sort A-Z by fullName
};

// Question 4: Instance method - softDelete()
userSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.isActive = false;
  return await this.save();
};

// Step 4: Add a pre-save middleware hook (original)
userSchema.pre('save', function () {
  console.log(`[Middleware Pre-save] Preparing to save user: ${this.fullName}`);
});

// Question 5: Pre-save hook - simulate password hashing
userSchema.pre('save', function () {
  if (this.isModified('password') && this.password) {
    console.log(`[Middleware Pre-save] Simulating password hashing for user: ${this.fullName}`);
    // Simulate hashing by reversing the string and adding a prefix
    this.password = `hashed_${this.password.split('').reverse().join('')}`;
    console.log(`[Middleware Pre-save] Password after simulated hashing: ${this.password}`);
  }
});

// Question 5: Pre-find query hook - filter out soft-deleted docs
userSchema.pre(/^find/, function () {
  // Automatically exclude soft-deleted documents from all find queries
  this.where({ isDeleted: { $ne: true } });
  console.log("[Middleware Pre-find] Automatically filtering out soft-deleted documents.");
});

// Step 5: Create the model from the schema
const User = mongoose.model('User', userSchema);

// Step 6: Run CRUD operations + Extended Questions Demo
async function runMongooseCRUD() {
  try {
    // Clear old data
    await User.deleteMany({});

    console.log("\n========================================");
    console.log("  BASE CRUD OPERATIONS");
    console.log("========================================\n");

    // --- C - CREATE
    const newUser = await User.create({
      fullName: "Nguyen Van Hung",
      email: "hung.nguyen@example.com",
      age: 22,
      role: "admin",
      phone: "0912345678",    // Valid Vietnamese phone
      password: "mySecret123"  // Will be "hashed" by pre-save hook
    });
    console.log("1. [CREATE] Successfully created new user:", newUser);

    // --- R - READ ---
    const foundUser = await User.findOne({ email: "hung.nguyen@example.com" });
    console.log("2. [READ] Found user by email:", foundUser.fullName);

    // --- U - UPDATE ---
    const updatedUser = await User.findByIdAndUpdate(
      newUser._id,
      { age: 23, role: "manager" },
      { returnDocument: 'after', runValidators: true }
    );
    console.log("3. [UPDATE] Successfully updated user:", updatedUser);

    // --- D - DELETE ---
    // await User.findByIdAndDelete(newUser._id);
    // console.log("4. [DELETE] User deleted successfully.");

    // QUESTION 1 DEMO: Test invalid Vietnamese phone number
    console.log("\n========================================");
    console.log("  QUESTION 1: Custom Phone Validation");
    console.log("========================================\n");

    try {
      const badPhoneUser = await User.create({
        fullName: "Le Van Test",
        email: "test.phone@example.com",
        age: 25,
        phone: "12345"  // Invalid phone number - should fail validation
      });
      console.log("This should NOT print:", badPhoneUser);
    } catch (error) {
      console.log("[Q1] Validation error for bad phone number:", error.message);
    }

    // Now create a user with a valid phone number
    const validPhoneUser = await User.create({
      fullName: "Tran Thi Mai",
      email: "mai.tran@example.com",
      age: 25,
      phone: "0356789012"  // Valid: starts with 03, 10 digits
    });
    console.log("[Q1] User with valid phone created successfully:", validPhoneUser.fullName, "- Phone:", validPhoneUser.phone);

    // QUESTION 2 DEMO: Virtual property displayInfo
    // 
    console.log("\n========================================");
    console.log("  QUESTION 2: Virtual Property displayInfo");
    console.log("========================================\n");

    const userForDisplay = await User.findOne({ email: "hung.nguyen@example.com" });
    console.log("[Q2] displayInfo virtual field:", userForDisplay.displayInfo);
    console.log("[Q2] JSON output includes virtual:");
    console.log(JSON.stringify(userForDisplay.toJSON(), null, 2));

    // QUESTION 3 DEMO: Static method findActiveByRole
    console.log("\n========================================");
    console.log("  QUESTION 3: Static Method findActiveByRole");
    console.log("========================================\n");

    // Create more users with different roles for demo
    await User.create({
      fullName: "Pham Minh Duc",
      email: "duc.pham@example.com",
      age: 30,
      role: "user",
      phone: "0987654321"
    });
    await User.create({
      fullName: "Hoang Anh Tu",
      email: "tu.hoang@example.com",
      age: 28,
      role: "user",
      phone: "0912348765"
    });

    const activeUsers = await User.findActiveByRole('user');
    console.log(`[Q3] Found ${activeUsers.length} active user(s) with role 'user' (sorted A-Z):`);
    activeUsers.forEach(u => console.log(`     - ${u.fullName} (${u.email})`));

    // QUESTION 4 DEMO: Instance method softDelete
    console.log("\n========================================");
    console.log("  QUESTION 4: Instance Method softDelete");
    console.log("========================================\n");

    const userToSoftDelete = await User.findOne({ email: "mai.tran@example.com" });
    console.log("[Q4] Before soft delete - isActive:", userToSoftDelete.isActive, ", isDeleted:", userToSoftDelete.isDeleted);
    await userToSoftDelete.softDelete();
    console.log("[Q4] After soft delete  - isActive:", userToSoftDelete.isActive, ", isDeleted:", userToSoftDelete.isDeleted);

    // QUESTION 5 DEMO: Pre-save password hashing + Pre-find filter
    console.log("\n========================================");
    console.log("  QUESTION 5: Middleware Hooks Demo");
    console.log("========================================\n");

    // 5a: Password hashing was already demonstrated when creating newUser above.
    // Let's create another user with a password to see the hook in action:
    const hashedUser = await User.create({
      fullName: "Vo Thanh Son",
      email: "son.vo@example.com",
      age: 35,
      role: "admin",
      phone: "0771234567",
      password: "superSecure99"
    });
    console.log("[Q5a] Stored (simulated hashed) password:", hashedUser.password);

    // 5b: Pre-find hook filters out soft-deleted documents automatically
    console.log("\n[Q5b] Finding all users (pre-find hook auto-filters soft-deleted):");
    const allVisibleUsers = await User.find({});
    console.log(`[Q5b] Total visible users: ${allVisibleUsers.length}`);
    allVisibleUsers.forEach(u => console.log(`     - ${u.fullName} (isDeleted: ${u.isDeleted})`));

    // Verify: the soft-deleted user (mai.tran) should NOT appear
    const deletedCheck = await User.findOne({ email: "mai.tran@example.com" });
    console.log(`[Q5b] Searching for soft-deleted user (mai.tran): ${deletedCheck ? 'FOUND (unexpected)' : 'NOT FOUND (correctly filtered out)'}`);

  } catch (error) {
    console.error("Mongoose validation/operation error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n-> Mongoose connection closed.");
  }
}

runMongooseCRUD();
