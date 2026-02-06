import Carousel, { CarouselItem } from './CarouselCardLogic.jsx';
import HeroCardImg1 from '../../assets/hero-card-1.jpg';
import HeroCardImg2 from '../../assets/habits.jpg';

import TreesImg from '../../assets/tree.png';

export default function CarouselCard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="rounded-xl overflow-hidden shadow-sm">
        
        <Carousel autoSlide autoSlideInterval={4000}>
          <CarouselItem>
            <img 
              src={TreesImg} 
              alt="Slide 1"
              // FIX DETAILS:
              // 1. Mobile: "h-auto w-full" -> Shows the full image naturally. No cropping.
              // 2. Laptop: "md:h-[350px] md:object-cover" -> Forces the slim banner look only on big screens.
              className="w-full h-auto md:h-[350px] md:object-cover object-top" 
            />
          </CarouselItem>

          <CarouselItem>
            <img 
              src={HeroCardImg1} 
              alt="Slide 2"
              className="w-full h-auto md:h-[350px] md:object-cover object-top" 
            />
          </CarouselItem>

          <CarouselItem>
            <img 
              src={HeroCardImg2} 
              alt="Slide 3"
              className="w-full h-auto md:h-[350px] md:object-cover object-top" 
            />
          </CarouselItem>
        </Carousel>
      </div>
    </div>
  );
}