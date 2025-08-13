import Address from "../models/Address.js";

export const addAddress = async (req, res) => {
  try {
    console.log("Adding address...",req.body);
    const userId = req.userId; // should be set from middleware
    const { fullName, phone, street, city, state, zip, country } = req.body.address;
    console.log(fullName,phone,street,city,state,zip,country);

    // Fetch existing addresses of the user
    const existingAddresses = await Address.find({ user: userId });

    // Limit to 3 addresses
    if (existingAddresses.length >= 3) {
      return res.status(400).json({ message: "Maximum 3 addresses allowed." });
    }

    // Set selected to true if this is the first address
    const isFirst = existingAddresses.length === 0;
    const newAddress = new Address({
      user: userId,
      fullName,
      phone,
      street,
      city,
      state,
      zip,
      country,
      selected: isFirst ? true : false
    });

    // Save new address
    await newAddress.save();

    // If this address is selected, mark others as unselected
    if (isFirst) {
      // No need to update others, but just in case
      await Address.updateMany(
        { user: userId, _id: { $ne: newAddress._id } },
        { selected: false }
      );
    }

    res.json({
      message: "Address Added Successfully",
      data: newAddress
    });

  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({
      message: "Server error while adding address",
      error
    });
  }
};

export const getuserAddress = async (req, res) => {
    try {
        const user = req.userId; // should match schema field name
        const address = await Address.find({ user });
        res.json({ message: "Address Retrieved Successfully", data: address });
    } catch (error) {
        res.status(500).json({ message: "Error Occurred", error });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const user = req.userId; // should match schema field name
        const { fullName, phone, street, city, state, zip, country } = req.body
        const address = await Address.findOneAndUpdate({ user }, {
            $set: {
                fullName, phone,
                street, city, state, zip, country
            }
        }, { new: true });
        res.json({ message: "Address Updated Successfully", data: address });
    } catch (error) {
        res.status(500).json({ message: "Error Occurred", error });
    }
}

export const deleteAddress = async (req, res) => {
    try {
        const user = req.userId; // should match schema field name
        await Address.findOneAndDelete({ user });
        res.json({ message: "Address Deleted Successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error Occurred", error });
    }
}