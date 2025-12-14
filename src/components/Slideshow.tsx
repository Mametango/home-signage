import { useState, useEffect } from 'react'
import './Slideshow.css'

interface Slide {
  id: number
  type: 'image' | 'text'
  content: string
  title?: string
}

const Slideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides] = useState<Slide[]>([
    {
      id: 1,
      type: 'text',
      title: 'ようこそ',
      content: 'ホームサイネージへ'
    },
    {
      id: 2,
      type: 'text',
      title: '今日も一日',
      content: 'お疲れ様です！'
    },
    {
      id: 3,
      type: 'text',
      title: '素敵な一日を',
      content: 'お過ごしください'
    }
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // 5秒ごとに切り替え

    return () => clearInterval(timer)
  }, [slides.length])

  const slide = slides[currentSlide]

  return (
    <div className="slideshow">
      <div className="slideshow-container">
        {slide.type === 'text' ? (
          <div className="slideshow-text">
            {slide.title && (
              <h3 className="slideshow-title">{slide.title}</h3>
            )}
            <p className="slideshow-content">{slide.content}</p>
          </div>
        ) : (
          <div className="slideshow-image">
            <img src={slide.content} alt={slide.title || 'Slide'} />
          </div>
        )}
      </div>
      <div className="slideshow-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`slideshow-indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`スライド ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Slideshow

