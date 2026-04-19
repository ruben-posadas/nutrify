function Signup() {
  return (
    <div>
      <h1>Sign Up</h1>
      <form>
        <div>
          <label>Name</label>
          <input type="text" />
        </div>
        <div>
          <label>Email</label>
          <input type="email" />
        </div>
        <div>
          <label>Password</label>
          <input type="password" />
        </div>
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}

export default Signup;