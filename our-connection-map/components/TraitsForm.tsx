
import React, { useState } from 'react';

interface Props {
  initialTraits?: string[];
  onSubmit: (traits: string[]) => void;
  isEdit?: boolean;
}

const EXAMPLES = ["등산하기", "두 딸의 아빠", "매일 1만보 걷기", "세계일주 꿈", "재테크 관심", "캠핑 매니아", "커피 애호가"];

const TraitsForm: React.FC<Props> = ({ initialTraits, onSubmit, isEdit = false }) => {
  const [traits, setTraits] = useState<string[]>(initialTraits || Array(10).fill(''));

  const handleChange = (idx: number, val: string) => {
    const next = [...traits];
    next[idx] = val;
    setTraits(next);
  };

  const isComplete = traits.every(t => t.trim().length > 0);

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-stone-800">{isEdit ? '특징 수정하기' : '나를 소개해볼까요?'}</h2>
        <p className="text-stone-500 font-medium">
          {isEdit ? '동료들에게 보여지는 내 정보를 업데이트합니다.' : '다른 동료들과 연결되기 위해 10가지를 적어주세요.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto pb-32 pr-2">
        {traits.map((trait, idx) => (
          <div key={idx} className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400 font-black text-[10px]">{idx + 1}</span>
            <input
              type="text"
              value={trait}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={idx < 3 ? `예: ${EXAMPLES[idx]}` : "나만의 특징..."}
              className="w-full bg-glass border border-white rounded-[1.5rem] py-5 pl-12 pr-6 focus:bg-white focus:border-orange-400 focus:outline-none transition-all text-sm font-semibold shadow-sm placeholder:text-stone-300"
            />
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#fff5f5] via-[#fff5f5]/90 to-transparent pointer-events-none">
        <button
          onClick={() => isComplete && onSubmit(traits)}
          disabled={!isComplete}
          className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all pointer-events-auto shadow-2xl ${
            isComplete 
              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-orange-200 active:scale-95' 
              : 'bg-white text-stone-300 border border-stone-100'
          }`}
        >
          {isEdit ? '정보 업데이트' : '특징 등록하고 시작하기'}
        </button>
      </div>
    </div>
  );
};

export default TraitsForm;
