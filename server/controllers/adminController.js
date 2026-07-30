const User = require('../models/Users');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const CustomerProfile = require('../models/CustomerProfile');
const RiderProfile = require('../models/RiderProfile');

// 1. Get Admin Dashboard statistics and monthly comparisons
exports.getStats = async (req, res) => {
  try {
    const customerCount = await User.countDocuments({ role: 'customer' });
    const restaurantCount = await Restaurant.countDocuments();
    const riderCount = await User.countDocuments({ role: 'rider' });

    const allOrders = await Order.find();
    
    // Sum total order amounts and calculate 15% admin commission
    const totalOrderAmount = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const adminRevenue = totalOrderAmount * 0.15; // 15% commission

    // Monthly comparisons
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const ordersThisMonth = allOrders.filter(o => o.createdAt >= thisMonthStart);
    const ordersPrevMonth = allOrders.filter(o => o.createdAt >= prevMonthStart && o.createdAt < thisMonthStart);

    const revenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.totalAmount, 0);
    const revenuePrevMonth = ordersPrevMonth.reduce((sum, o) => sum + o.totalAmount, 0);

    const usersThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonthStart } });
    const usersPrevMonth = await User.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: thisMonthStart } });

    // Recent orders with customer, restaurant, and rider details
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .populate('rider', 'name');

    // Dynamic 6-month revenue trend (15% commission of monthly totals)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const monthOrders = allOrders.filter(o => o.createdAt >= monthStart && o.createdAt <= monthEnd);
      const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 0.15;
      
      const label = d.toLocaleDateString(undefined, { month: 'short' });
      monthlyTrend.push({
        label,
        revenue: monthRevenue
      });
    }

    // Top Restaurants by order volume
    const restaurantOrderCounts = {};
    allOrders.forEach(o => {
      const rId = o.restaurant.toString();
      restaurantOrderCounts[rId] = (restaurantOrderCounts[rId] || 0) + 1;
    });

    const restaurants = await Restaurant.find().select('name cuisine');
    const topRestaurants = restaurants.map(r => ({
      _id: r._id,
      name: r.name,
      cuisine: r.cuisine,
      orderCount: restaurantOrderCounts[r._id.toString()] || 0
    })).sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);

    // Top Customers by total spend
    const customerOrderData = {};
    allOrders.forEach(o => {
      const cId = o.customer.toString();
      if (!customerOrderData[cId]) {
        customerOrderData[cId] = { count: 0, spent: 0 };
      }
      customerOrderData[cId].count++;
      customerOrderData[cId].spent += o.totalAmount;
    });

    const customers = await User.find({ role: 'customer' }).select('name email');
    const topCustomers = customers.map(c => {
      const data = customerOrderData[c._id.toString()] || { count: 0, spent: 0 };
      return {
        _id: c._id,
        name: c.name,
        email: c.email,
        orderCount: data.count,
        totalSpent: data.spent
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    // Top Riders by completed deliveries
    const riderDeliveryCounts = {};
    allOrders.forEach(o => {
      if (o.rider && o.status === 'delivered') {
        const rId = o.rider.toString();
        riderDeliveryCounts[rId] = (riderDeliveryCounts[rId] || 0) + 1;
      }
    });

    const riders = await User.find({ role: 'rider' }).select('name email');
    const topRiders = riders.map(r => ({
      _id: r._id,
      name: r.name,
      email: r.email,
      deliveryCount: riderDeliveryCounts[r._id.toString()] || 0
    })).sort((a, b) => b.deliveryCount - a.deliveryCount).slice(0, 5);

    // Cuisine distribution (derived from orders)
    const cuisineCounts = {};
    for (const o of allOrders) {
      const rest = restaurants.find(r => r._id.toString() === o.restaurant.toString());
      if (rest && rest.cuisine) {
        rest.cuisine.forEach(c => {
          cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
        });
      }
    }
    const cuisineDistribution = Object.keys(cuisineCounts).map(name => ({
      name,
      count: cuisineCounts[name]
    })).sort((a, b) => b.count - a.count).slice(0, 6);

    // Orders status breakdown for analytics
    const statusCounts = {
      placed: 0,
      confirmed: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };
    allOrders.forEach(o => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    });

    res.status(200).json({
      counts: {
        customers: customerCount,
        restaurants: restaurantCount,
        riders: riderCount,
        orders: allOrders.length
      },
      revenue: {
        totalOrdersAmount: totalOrderAmount,
        adminCommission: adminRevenue
      },
      monthlyComparison: {
        orders: {
          current: ordersThisMonth.length,
          previous: ordersPrevMonth.length
        },
        revenue: {
          current: revenueThisMonth * 0.15,
          previous: revenuePrevMonth * 0.15
        },
        registrations: {
          current: usersThisMonth,
          previous: usersPrevMonth
        }
      },
      recentOrders,
      topRestaurants,
      topCustomers,
      topRiders,
      cuisineDistribution,
      statusCounts,
      monthlyTrend
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ msg: 'Server error fetching statistics' });
  }
};

// 2. Get detailed list of all customers, profiles, and order count/spend
exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    const profiles = await CustomerProfile.find();
    const orders = await Order.find();

    const customerList = customers.map(user => {
      const profile = profiles.find(p => p.user.toString() === user._id.toString());
      const customerOrders = orders.filter(o => o.customer.toString() === user._id.toString());
      const totalSpent = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        phone: profile ? profile.phone : 'N/A',
        address: profile ? profile.address : 'N/A',
        favoriteCuisines: profile ? profile.favoriteCuisines : [],
        savedAddressesCount: profile && profile.savedAddresses ? profile.savedAddresses.length : 0,
        orderCount: customerOrders.length,
        totalSpent: totalSpent
      };
    });

    res.status(200).json(customerList);
  } catch (err) {
    console.error('Error fetching admin customers:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// 3. Get detailed list of all restaurants, owners, and revenues
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate('owner', 'name email');
    const orders = await Order.find();

    const restaurantList = restaurants.map(rest => {
      const restOrders = orders.filter(o => o.restaurant.toString() === rest._id.toString());
      const totalRevenue = restOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const commission = totalRevenue * 0.15;

      return {
        _id: rest._id,
        name: rest.name,
        cuisine: rest.cuisine || [],
        address: rest.address || 'N/A',
        rating: rest.rating || 4.0,
        openingTime: rest.openingTime || 'N/A',
        closingTime: rest.closingTime || 'N/A',
        ownerName: rest.owner ? rest.owner.name : 'N/A',
        ownerEmail: rest.owner ? rest.owner.email : 'N/A',
        orderCount: restOrders.length,
        totalRevenue: totalRevenue,
        commissionGenerated: commission
      };
    });

    res.status(200).json(restaurantList);
  } catch (err) {
    console.error('Error fetching admin restaurants:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// 4. Get detailed list of all riders, profiles, and deliveries
exports.getRiders = async (req, res) => {
  try {
    const riders = await User.find({ role: 'rider' }).select('-password');
    const profiles = await RiderProfile.find();
    const orders = await Order.find();

    const riderList = riders.map(user => {
      const profile = profiles.find(p => p.user.toString() === user._id.toString());
      const completedDeliveries = orders.filter(o => o.rider && o.rider.toString() === user._id.toString() && o.status === 'delivered');

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        vehicleType: profile ? profile.vehicleType : 'N/A',
        isOnline: profile ? profile.isOnline : false,
        rating: profile ? profile.rating : 5.0,
        deliveryCount: completedDeliveries.length
      };
    });

    res.status(200).json(riderList);
  } catch (err) {
    console.error('Error fetching admin riders:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// 5. Get detailed list of all system orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .populate('rider', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
