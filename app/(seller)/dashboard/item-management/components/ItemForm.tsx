"use client";
import BasicInfoFields from "./fields/BasicInfoFields";
import CategoryFields from "./fields/CategoryFields";
import PriceFields from "./fields/PriceFields";
import ProductDimensionFields from "./fields/ProductDimensionFields";
import ServiceFields from "./fields/ServiceFields";
import ImageUploader from "./fields/ImageUploader";
import { useItemForm } from "@/hooks/useItemForm";
import { SubmitButton as OriginalSubmitButton } from "../../components/commons/SubmitButton";

interface Props {
  onClose: () => void;
  item?: any;
}

export default function ItemForm({ onClose, item }: Props) {
  const form = useItemForm(item);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit(onClose);
      }}
      className="space-y-6 text-gray-800"
    >
      <BasicInfoFields
        title={form.title}
        setTitle={form.setTitle}
        description={form.description}
        setDescription={form.setDescription}
        keywords={form.keywords}
        setKeywords={form.setKeywords}
      />

      <CategoryFields
        categories={form.categories}
        selectedCategory={form.selectedCategory}
        setSelectedCategory={form.setSelectedCategory}
        selectedChildCategory={form.selectedChildCategory}
        setSelectedChildCategory={form.setSelectedChildCategory}
      />

      <PriceFields
        salesPrice={form.salesPrice}
        setSalesPrice={form.setSalesPrice}
        regularPrice={form.regularPrice}
        setRegularPrice={form.setRegularPrice}
        quantity={form.quantity}
        setQuantity={form.setQuantity}
        shopType={form.shopType}
      />

      {form.shopType === "products" && (
        <ProductDimensionFields
          weight={form.weight}
          setWeight={form.setWeight}
          weightUnit={form.weightUnit}
          setWeightUnit={form.setWeightUnit}
          lengthVal={form.lengthVal}
          setLengthVal={form.setLengthVal}
          widthVal={form.widthVal}
          setWidthVal={form.setWidthVal}
          heightVal={form.heightVal}
          setHeightVal={form.setHeightVal}
          sizeUnit={form.sizeUnit}
          setSizeUnit={form.setSizeUnit}
        />
      )}

      {form.shopType === "services" && (
        <ServiceFields
          pricingModel={form.pricingModel}
          setPricingModel={form.setPricingModel}
          deliveryMethod={form.deliveryMethod}
          setDeliveryMethod={form.setDeliveryMethod}
          estimatedDeliveryTime={form.estimatedDeliveryTime}
          setEstimatedDeliveryTime={form.setEstimatedDeliveryTime}
          availableDays={form.availableDays}
          setAvailableDays={form.setAvailableDays}
          availableFrom={form.availableFrom}
          setAvailableFrom={form.setAvailableFrom}
          availableTo={form.availableTo}
          setAvailableTo={form.setAvailableTo}
          dayOptions={form.dayOptions}
        />
      )}

      <ImageUploader
        existingImages={form.existingImages}
        newPreviews={form.newPreviews}
        handleImagesChange={form.handleImagesChange}
        removeExistingImage={form.removeExistingImage}
        removeNewImage={form.removeNewImage}
        itemId={form.itemId}
      />

      <div>
        {typeof OriginalSubmitButton !== "undefined" ? (
          <OriginalSubmitButton
            loading={form.loading}
            label={item?.id ? "Update item" : "Save changes"}
          />
        ) : (
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={form.loading}
          >
            {form.loading
              ? "Saving..."
              : item?.id
              ? "Update item"
              : "Save changes"}
          </button>
        )}
      </div>
    </form>
  );
}
