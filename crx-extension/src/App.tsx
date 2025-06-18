import { useAppContext } from './context/AppContext.tsx';
import Invalid from './Invalid.tsx';
import Welcome from './Welcome.tsx';

function App() {
    const { validUrl } = useAppContext();

    return (
      <div className={'relative h-dvh p-4 flex justify-center items-center flex-col bg-black text-white'}>
          {
              validUrl ? (<Welcome />) : (<Invalid />)
          }
          <div className={'fixed bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-400'}>
              Made by <a href="https://duc1607.me?utm_source=thread-ext" target="_blank"
                         className={'text-rose-500 hover:text-rose-300'}>duc1607</a> with ❤️
          </div>
      </div>
    );
}

export default App;
