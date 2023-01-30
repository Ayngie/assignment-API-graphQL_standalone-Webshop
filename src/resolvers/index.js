/*------------------------------- imports -------------------------------*/

const path = require("path");
const fsPromises = require("fs/promises");
const {
  fileExists,
  readJsonFile,
  deleteFile,
  getDirectoryFileNames,
} = require("../utils/fileHandling");
const { GraphQLError, printType } = require("graphql");
const crypto = require("crypto");
const axios = require("axios").default;

/*------------------------------- global file paths -------------------------------*/

const productsDirectory = path.join(__dirname, "..", "data", "products");
const shoppingCartsDirectory = path.join(
  __dirname,
  "..",
  "data",
  "shoppingCarts"
);

/*------------------------------- resolvers -------------------------------*/

exports.resolvers = {
  /*---------------------- queries -----------------------*/
  Query: {
    /*-------- product --------*/

    getProductById: async (_, args) => {
      // Place the productId the user sent in a variable called "productId"
      const productId = args.productId;
      // Create a variable holding the file path (from computer root directory) to the product file we are looking for
      const productFilePath = path.join(productsDirectory, `${productId}.json`);

      // Check if the requested product actually exists
      const productExists = await fileExists(productFilePath);
      // If product does not exist return an error notifying the user of this
      if (!productExists)
        return new GraphQLError("That product does not exist");

      // Read the product file; data will be returned as a JSON string
      const productData = await fsPromises.readFile(productFilePath, {
        encoding: "utf-8",
      });
      // Parse the returned JSON product data into a JS object
      const data = JSON.parse(productData);
      // Return the data
      return data;
    },

    getAllProducts: async (_, args) => {
      // Get an array of file names that exist in the products directory (aka a list of all the products we have)
      const allProducts = await getDirectoryFileNames(productsDirectory);

      // Create a variable with an empty array to hold all products data
      const allProductsData = [];

      // For each file found in products...
      for (const file of allProducts) {
        // ... create the filepath for that specific file
        const filePath = path.join(productsDirectory, file);
        // Read the contents of the file; will return a JSON string of the products data
        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });
        // Parse the JSON data from the previous step
        const data = JSON.parse(fileContents);
        // Push the parsed data to the allProductsData array
        allProductsData.push(data);
      }

      // Return the allProductsData array (which should now hold the data for all products)
      return allProductsData;
    },

    /*-------- shopping cart --------*/

    getShoppingCartById: async (_, args) => {
      const shoppingCartId = args.shoppingCartId;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      // Check if shoppingCart exists
      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, that shoppingcart does not exist! Try again :)"
        );

      // Read and parse file
      const shoppingCartData = await fsPromises.readFile(shoppingCartFilePath, {
        encoding: "utf-8",
      });
      const data = JSON.parse(shoppingCartData);

      return data;
    },

    getAllShoppingCarts: async (_) => {
      const allShoppingCarts = await getDirectoryFileNames(
        shoppingCartsDirectory
      );

      const allShoppingCartsData = [];

      for (const file of allShoppingCarts) {
        const filePath = path.join(shoppingCartsDirectory, file);
        // Read and parse file
        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });
        const data = JSON.parse(fileContents);

        allShoppingCartsData.push(data);
      }

      return allShoppingCartsData;
    },
  },

  /*---------------------- mutations -----------------------*/

  Mutation: {
    /*-------- product --------*/

    createProduct: async (_, args) => {
      if (args.name.length === 0)
        return new GraphQLError("Name must be at least 1 character long");

      const newProduct = {
        id: crypto.randomUUID(),
        name: args.name,
        description: args.description || "",
        unitPrice: args.unitPrice,
      };

      let productFilePath = path.join(
        productsDirectory,
        `${newProduct.id}.json`
      );

      // Check so id/file is unique
      let idExists = true;
      while (idExists) {
        const exists = await fileExists(productFilePath);
        console.log(exists, newProduct.id);
        // if id/file already exists:
        if (exists) {
          newProduct.id = crypto.randomUUID();
          productFilePath = path.join(
            productsDirectory,
            `${newProduct.id}.json`
          );
        }
        // break loop
        idExists = exists;
      }

      // create file
      await fsPromises.writeFile(productFilePath, JSON.stringify(newProduct));

      return newProduct;
    },

    updateProduct: async (_, args) => {
      const { id, name, description, unitPrice } = args;
      const productFilePath = path.join(productsDirectory, `${id}.json`);

      const productExists = await fileExists(productFilePath);
      if (!productExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that product does not exist."
        );

      const updatedProduct = {
        id,
        name,
        description,
        unitPrice,
      };

      await fsPromises.writeFile(
        productFilePath,
        JSON.stringify(updatedProduct)
      );

      return updatedProduct;
    },

    deleteProduct: async (_, args) => {
      const productId = args.productId;
      const productFilePath = path.join(productsDirectory, `${productId}.json`);

      // Check product exists
      const productExists = await fileExists(productFilePath);
      if (!productExists)
        return new GraphQLError("That product does not exist");

      // delete file
      try {
        await deleteFile(productFilePath);
      } catch (error) {
        return {
          deletedId: productId,
          success: false,
        };
      }

      return {
        deletedId: productId,
        success: true,
      };
    },

    /*-------- shopping cart --------*/

    createNewShoppingCart: async (_, args) => {
      const newShoppingCart = {
        id: crypto.randomUUID(),
        itemsInCart: [],
        totalSum: 0,
      };

      let filePath = path.join(
        shoppingCartsDirectory,
        `${newShoppingCart.id}.json`
      );

      // Check so id/file is unique
      let idExists = true;
      while (idExists) {
        const exists = await fileExists(filePath);
        console.log(exists, newShoppingCart.id);
        // if id/file already exists:
        if (exists) {
          newShoppingCart.id = crypto.randomUUID();
          filePath = path.join(productsDirectory, `${newShoppingCart.id}.json`);
        }
        // break loop
        idExists = exists;
      }

      // create new file
      await fsPromises.writeFile(filePath, JSON.stringify(newShoppingCart));

      return newShoppingCart;
    },

    deleteShoppingCart: async (_, args) => {
      const shoppingCartId = args.shoppingCartId;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      // Check if exists
      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that shoppingcart does not exist."
        );

      // delete file
      try {
        await deleteFile(shoppingCartFilePath);
      } catch (error) {
        return {
          deletedId: shoppingCartId,
          success: false,
        };
      }

      return {
        deletedId: shoppingCartId,
        success: true,
      };
    },
    /*-------- + / - cartItems --------*/

    addCartItem: async (_, args) => {
      const { shoppingCartId, productId } = args;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      // Check cart exists
      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that shoppingcart does not exist."
        );
      const shoppingCartToUpdate = await readJsonFile(shoppingCartFilePath);

      // check if item exists (if yes:  quantity++)
      let itemInCartExists = false;
      for (let cartItem of shoppingCartToUpdate.itemsInCart) {
        if (cartItem.id === productId) {
          cartItem.quantity++;
          itemInCartExists = true;
        }
      }

      // add new item
      if (!itemInCartExists) {
        const productFilePath = path.join(
          productsDirectory,
          `${productId}.json`
        );

        // (check product exists in directory)
        const productExists = await fileExists(productFilePath);
        if (!productExists)
          return new GraphQLError(
            "Sorry, that product doesn't exist in our directory."
          );

        //read product data and create data for new cartItem
        const productToAdd = await readJsonFile(productFilePath);

        const newCartItem = {
          id: productToAdd.id,
          name: productToAdd.name,
          unitPrice: productToAdd.unitPrice,
          quantity: 1,
        };

        //push new cartItem into shoppingCart
        shoppingCartToUpdate.itemsInCart.push(newCartItem);
      }

      //update totalSum
      let newSum = 0;
      for (let cartItem of shoppingCartToUpdate.itemsInCart) {
        newSum += cartItem.quantity * cartItem.unitPrice;
      }
      shoppingCartToUpdate.totalSum = newSum;

      //update cart
      await fsPromises.writeFile(
        shoppingCartFilePath,
        JSON.stringify(shoppingCartToUpdate)
      );

      return shoppingCartToUpdate;
    },

    removeCartItem: async (_, args) => {
      const { shoppingCartId, cartItemId } = args;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      // Check cart exists
      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that shoppingcart does not exist."
        );
      const shoppingCartToUpdate = await readJsonFile(shoppingCartFilePath);

      // check if item exists in cart (if yes: quantity-- or remove if 0)
      let itemInCartExist = false;
      for (let i = 0; i > shoppingCartToUpdate.itemsInCart.length; i++) {
        if (shoppingCartToUpdate.itemsInCart[i].id === cartItemId) {
          shoppingCartToUpdate.itemsInCart[i].quantity--;
          itemInCartExist = true;
          if (shoppingCartToUpdate.itemsInCart[i].quantity === 0) {
            console.log(shoppingCartToUpdate.itemsInCart[i].quantity);
            shoppingCartToUpdate.itemsInCart.splice(i, 1);
          }
        }
      }
      // item does not exist in cart
      if (!itemInCartExist) {
        return new GraphQLError(
          "Sorry, that product is not in the shoppingcart."
        );
      }

      //update totalSum
      let sum = 0;
      for (let cartItem of shoppingCartToUpdate.itemsInCart) {
        sum += cartItem.quantity * cartItem.price;
      }
      shoppingCartToUpdate.totalSum = sum;

      //update cart
      await fsPromises.writeFile(
        shoppingCartFilePath,
        JSON.stringify(shoppingCartToUpdate)
      );

      return shoppingCartToUpdate;
    },

    emptyAllCartItems: async (_, args) => {
      const { shoppingCartId } = args;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      // Check cart exists
      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that shoppingcart does not exist."
        );

      //empty existing cart of cartItems
      const shoppingCartToUpdate = await readJsonFile(shoppingCartFilePath);
      let emptyArray = [];
      let totalSum = 0;

      shoppingCartToUpdate.itemsInCart = emptyArray;
      shoppingCartToUpdate.totalSum = totalSum;

      //update cart:
      await fsPromises.writeFile(
        shoppingCartFilePath,
        JSON.stringify(shoppingCartToUpdate)
      );

      return shoppingCartToUpdate;
    },
  },
};
