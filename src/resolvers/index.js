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

// Create a variable holding the file path (from computer root directory) to the product file directory
const productsDirectory = path.join(__dirname, "..", "data", "products");
const shoppingCartsDirectory = path.join(
  __dirname,
  "..",
  "data",
  "shoppingCarts"
);
// const cartItemsDirectory = path.join(__dirname, "..", "data", "cartItems");

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
      // Place the shoppingCartId the user sent in a variable called "shoppingCartId"
      const shoppingCartId = args.shoppingCartId;
      // Create a variable holding the file path (from computer root directory) to the shoppingCart file we are looking for
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      // Check if the requested shoppingCart actually exists
      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      // If shoppingCart does not exist return an error notifying the user of this
      if (!shoppingCartExists)
        return new GraphQLError("That shopping cart does not exist");

      // Read the shoppingCart file; data will be returned as a JSON string
      const shoppingCartData = await fsPromises.readFile(shoppingCartFilePath, {
        encoding: "utf-8",
      });
      // Parse the returned JSON shoppingCart data into a JS object
      const data = JSON.parse(shoppingCartData);
      // Return the data
      return data;
    },

    getAllShoppingCarts: async (_) => {
      // Get an array of file names that exist in the ShoppingCarts directory (aka a list of all the ShoppingCarts we have)
      const allShoppingCarts = await getDirectoryFileNames(
        shoppingCartsDirectory
      );

      // Create a variable with an empty array to hold all ShoppingCarts data
      const allShoppingCartsData = [];

      // For each file found in ShoppingCarts...
      for (const file of allShoppingCarts) {
        // ... create the filepath for that specific file
        const filePath = path.join(productsDirectory, file);
        // Read the contents of the file; will return a JSON string of the ShoppingCarts data
        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });
        // Parse the JSON data from the previous step
        const data = JSON.parse(fileContents);
        // Push the parsed data to the allShoppingCartsData array
        allShoppingCartsData.push(data);
      }

      // Return the allShoppingCartsData array (which should now hold the data for all ShoppingCarts)
      return allShoppingCartsData;
    },
  },

  /*---------------------- mutations -----------------------*/

  Mutation: {
    /*-------- product --------*/

    createProduct: async (_, args) => {
      // Verify name: om strängen är tom, return:a en error
      if (args.name.length === 0)
        return new GraphQLError("Name must be at least 1 character long");

      // Skapa ett unikt id + data objektet
      const newProduct = {
        // Generera ett random id (av typ UUID)
        id: crypto.randomUUID(),
        name: args.name,
        unitPrice: args.unitPrice,
      };

      // Skapa filePath för där vi ska skapa våran fil
      let filePath = path.join(productsDirectory, `${newProduct.id}.json`);

      // Kolla att vårat auto-genererade productId inte har använts förut
      let idExists = true;
      while (idExists) {
        const exists = await fileExists(filePath); // kolla om filen existerar
        console.log(exists, newProduct.id);
        // om filen redan existerar generera ett nytt productId och uppdatera filePath
        if (exists) {
          newProduct.id = crypto.randomUUID();
          filePath = path.join(productsDirectory, `${newProduct.id}.json`);
        }
        // uppdatera idExists (för att undvika infinite loops)
        idExists = exists;
      }

      // Skapa en fil för produkten i /data/products
      await fsPromises.writeFile(filePath, JSON.stringify(newProduct));

      // Return:a våran respons; vårat nyskapade produkt
      return newProduct;
    },

    updateProduct: async (_, args) => {
      // Hämta alla parametrar från args
      /* const productId = args.id
			const productName = args.name
			const productUnitPrice = args.unitPrice */

      const { id, name, unitPrice } = args;

      // Skapa våran filePath
      const filePath = path.join(productsDirectory, `${id}.json`);

      // Finns det produkt som de vill ändra?
      // IF (no) return Not Found Error
      const productExists = await fileExists(filePath);
      if (!productExists)
        return new GraphQLError("That product does not exist");

      // Skapa updatedProduct objekt
      const updatedProduct = {
        id,
        name,
        unitPrice,
      };

      // Skriv över den gamla filen med nya infon
      await fsPromises.writeFile(filePath, JSON.stringify(updatedProduct));

      // return updatedProduct
      return updatedProduct;
    },

    deleteProduct: async (_, args) => {
      // get product id
      const productId = args.productId;

      const filePath = path.join(productsDirectory, `${productId}.json`);
      // does this product exist?
      // If no (return error)
      const productExists = await fileExists(filePath);
      if (!productExists)
        return new GraphQLError("That product does not exist");

      // delete file
      try {
        await deleteFile(filePath);
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
      // Verify name: om strängen är tom, return:a en error
      // if (args.productsIds === 0)
      //   return new GraphQLError("Shopping cart must include at least 1 item");

      // Skapa ett unikt id + data objektet
      const newShoppingCart = {
        // Generera ett random id (av typ UUID)
        id: crypto.randomUUID(),
      };

      // Skapa filePath för där vi ska skapa våran fil
      let filePath = path.join(
        shoppingCartsDirectory,
        `${newShoppingCart.id}.json`
      );

      // Kolla att vårat auto-genererade newShoppingCartId inte har använts förut
      let idExists = true;
      while (idExists) {
        const exists = await fileExists(filePath); // kolla om filen existerar
        console.log(exists, newShoppingCart.id);
        // om filen redan existerar generera ett nytt newShoppingCartId och uppdatera filePath
        if (exists) {
          newShoppingCart.id = crypto.randomUUID();
          filePath = path.join(productsDirectory, `${newShoppingCart.id}.json`);
        }
        // uppdatera idExists (för att undvika infinite loops)
        idExists = exists;
      }

      // Skapa en fil för nya ShoppingCarten i /data/ShoppingCarts
      await fsPromises.writeFile(filePath, JSON.stringify(newShoppingCart));

      // Return:a våran respons; vårat nyskapade ShoppingCart
      return newShoppingCart;
    },

    // createShoppingCart: async (_, args) => {
    //   // Verify name: om strängen är tom, return:a en error
    //   if (args.productsIds === 0)
    //     return new GraphQLError("Shopping cart must include at least 1 item");

    //   // Skapa ett unikt id + data objektet
    //   const newShoppingCart = {
    //     // Generera ett random id (av typ UUID)
    //     id: crypto.randomUUID(),
    //     items: args.items,
    //     totalSum: args.totalSum,
    //   };

    //   // Skapa filePath för där vi ska skapa våran fil
    //   let filePath = path.join(
    //     shoppingCartsDirectory,
    //     `${newShoppingCart.id}.json`
    //   );

    //   // Kolla att vårat auto-genererade newShoppingCartId inte har använts förut
    //   let idExists = true;
    //   while (idExists) {
    //     const exists = await fileExists(filePath); // kolla om filen existerar
    //     console.log(exists, newShoppingCart.id);
    //     // om filen redan existerar generera ett nytt newShoppingCartId och uppdatera filePath
    //     if (exists) {
    //       newShoppingCart.id = crypto.randomUUID();
    //       filePath = path.join(productsDirectory, `${newShoppingCart.id}.json`);
    //     }
    //     // uppdatera idExists (för att undvika infinite loops)
    //     idExists = exists;
    //   }

    //   // Skapa en fil för nya ShoppingCarten i /data/ShoppingCarts
    //   await fsPromises.writeFile(filePath, JSON.stringify(newShoppingCart));

    //   // Return:a våran respons; vårat nyskapade ShoppingCart
    //   return newShoppingCart;
    // },

    // addToShoppingCart: async (_, args) => {
    //     return null;
    //   },
  },
};
