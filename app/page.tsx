import CategorySection from "./components/CategorySection";
import HeroBanner from "./components/HeroBanner"; 
import RecommendedItems from "./components/RecommendedItems"; 

export default function Home() {
  return (
    <div className="bg-gray-50">
      <HeroBanner />
      <CategorySection type="products" />
      <CategorySection type="services" />
      <RecommendedItems type="products" />
      <RecommendedItems type="services" /> 
      
    </div>
  );
}
