const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("stock_quantity", stockQuantity);
  formData.append("category_id", categoryId);
  
  
  if (imageFile) {
    formData.append("file", imageFile); 
  }

  try {
    await createProduct(formData);
    alert("Product created successfully!");
  } catch (err) {
    alert(getErrorMessage(err, 'Unable to create product'));
  }
};