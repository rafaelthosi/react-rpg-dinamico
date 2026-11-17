function ProfileSelector({ value, onChange, required = false }) {
  const profiles = [
    { value: "gm", label: "GM" },
    { value: "player", label: "Jogador" },
  ];

  return (
    <fieldset className="profile-fieldset">
      <legend>Qual o seu perfil?</legend>
      <div className="profile-selector">
        {profiles.map((profile) => (
          <label
            className={`profile-selector__option ${
              value === profile.value ? "profile-selector__option--selected" : ""
            }`}
            key={profile.value}
          >
            <input
              checked={value === profile.value}
              name="perfil"
              onChange={() => onChange(profile.value)}
              required={required}
              type="radio"
              value={profile.value}
            />
            <span>{profile.label}</span>
          </label>
        ))}
        <span className="profile-selector__divider" />
      </div>
    </fieldset>
  );
}

export default ProfileSelector;
