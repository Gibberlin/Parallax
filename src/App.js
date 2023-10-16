import logo from './logo.svg';
import './App.css';
import { Parallax, ParallaxLayer } from '@react-spring/parallax';
import anime_girl from "./images/anime_girl.jpg";
import wall from "./images/sky_Wall.jpeg";
import VNav from './Nav/VNav';

function App() {
  return (
    <div className="App">
    <Parallax pages={10}>
    
      <ParallaxLayer speed={1} 
      style={{
        backgroundImage:`url(${anime_girl})`,
        backgroundSize:'cover',
      }}
      factor={4}>
        <h2>I love Anime</h2>
      </ParallaxLayer>

      <ParallaxLayer offset={0}
      sticky={(0,10)}
      style={{
        backgroundColor:'rgba(3,3,3,0)',
      }}>
        <VNav/>
      </ParallaxLayer>

      <ParallaxLayer offset={1} speed={0.5}>
        <h1>The World is gonna end!!!</h1>
      </ParallaxLayer>

      <ParallaxLayer offset={2}
      factor={4}
      speed={0.8}
      style={{
        backgroundImage:`url(${wall})`,
        backgroundSize:'cover',
      }}>
      
      </ParallaxLayer>
    </Parallax>
    </div>
  );
}

export default App;
