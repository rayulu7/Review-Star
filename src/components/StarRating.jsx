
import React, { useState, useEffect } from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

const StarRating = ({ selectedStars = 0, onRate, resetKey }) => {
  const [rating, setRating] = useState(selectedStars);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const [isHalf, setIsHalf] = useState(false);

  
  useEffect(() => {
    setRating(0);
    setHoveredIndex(0);
    setIsHalf(false);
  }, [resetKey]);

 
  useEffect(() => {
    setRating(selectedStars);
  }, [selectedStars]);

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2;

    setHoveredIndex(index);
    setIsHalf(half);
  };

  const handleClick = (index) => {
    const value = isHalf ? index - 0.5 : index;

    
    if (rating === value) {
      setRating(0);
      onRate(0);
    } else {
      setRating(value);
      onRate(value);
    }
  };

  const getIcon = (index) => {
    const realRating = rating || 0;
    const full = Math.floor(realRating);
    const hasHalf = realRating % 1 !== 0;

    if (index <= full) {
      return <FaStar color="gold" />;
    }

    if (index === full + 1 && hasHalf) {
      return <FaStarHalfAlt color="gold" />;
    }

    if (!realRating) {
      if (index < hoveredIndex) return <FaStar color="gold" />;
      if (index === hoveredIndex && isHalf) return <FaStarHalfAlt color="gold" />;
    }

    return <FaRegStar color="#ccc" />;
  };

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((index) => (
        <span
          key={index}
          className="star"
          onMouseMove={(e) => handleMouseMove(e, index)}
          onClick={() => handleClick(index)}
        >
          {getIcon(index)}
        </span>
      ))}
    </div>
  );
};

export default StarRating;