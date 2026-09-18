function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07110d",
        color: "#20df78",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "20px"
      }}
    >
      <div style={{ fontSize: "60px" }}>⚡</div>

      <h1 style={{ margin: "15px 0 5px" }}>
        AeroMint
      </h1>

      <p style={{ color: "#8d9c94" }}>
        React is working!
      </p>

      <p style={{ color: "#20df78", fontSize: "13px" }}>
        Frontend test successful
      </p>
    </div>
  );
}

export default App;
