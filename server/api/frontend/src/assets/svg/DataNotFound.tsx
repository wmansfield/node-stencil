const DataNotFound = ({ height = 100, width = 100 }: { height?: number; width?: number }) => {
   return (
      <svg
         xmlns="http://www.w3.org/2000/svg"
         xmlSpace="preserve"
         aria-label="Data not found"
         viewBox="0 0 512 400"
         x={0}
         y={0}
         height={height}
         width={width}
      >
         <path d="M64 96c0-8.8 7.2-16 16-16h128l24 28h204c8.8 0 16 7.2 16 16v164c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V96z" fill="#d3d3d3" />
         <path
            d="M36 136c1.3-5.6 6.3-9.6 12-9.6h416c8.3 0 14.3 7.7 12.3 15.7L436 344c-1.6 6.8-7.6 11.6-14.6 11.6H68c-8.8 0-15.3-8-13.3-16L36 136z"
            fill="#00adef"
         />
         <path d="M36 136h440l-24 104H60z" opacity="0.1" />
         <rect x="244" y="180" width="24" height="88" rx="12" fill="#ffffff" />
         <circle cx="256" cy="290" r="14" fill="#ffffff" />
      </svg>
   );
};

export default DataNotFound;
