import { useAppContext } from "./context/AppContext";
import Tutorial1 from "/tutorial-1.png";
import Tutorial2 from "/tutorial-2.png";

const Invalid = () => {
    const { initApp } = useAppContext();

    return (
      <div className={'flex flex-col items-center gap-4 p-4 rounded-2xl border border-rose-400 border-dashed'}>
          <div className={'text-2xl text-rose-400'}>
              Không hỗ trợ trang này
          </div>
          <div className={'w-full text-left'}>
              Hướng dẫn:
          </div>
          <div className={'space-y-2'}>
              <p>1. Click vào link hashtag.</p>
              <img src={Tutorial1} alt="tutorial-1" />
              <p>2. Sang tab Gần đây (Recent).</p>
              <img src={Tutorial2} alt="tutorial-2" />
              <p>3. Bấm <b>Thử lại</b> bên dưới.</p>
          </div>
          <button
            className={'cursor-pointer rounded-full bg-cyan-500 transition-colors hover:bg-cyan-700 text-white px-4 py-2'}
            onClick={initApp}>
              Thử lại
          </button>
      </div>
    );
};

export default Invalid;
