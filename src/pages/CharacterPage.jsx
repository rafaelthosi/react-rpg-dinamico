import { useLocation } from "react-router-dom";
import CharacterInfoSection from "../components/CharacterInfoSection.jsx";
import Header from "../components/Header.jsx";

function CharacterPage() {
  const location = useLocation();
  const characterGroups = location.state?.characterGroups;
  const selectedGroupName = location.state?.groupName;
  const filteredCharacterGroups = Array.isArray(characterGroups)
    ? characterGroups.filter((group) => (
      !group.basicInfo
      && (!selectedGroupName || group.father === selectedGroupName)
    ))
    : [];
  return (
    <>
      <Header />

      <main className="character-content">
        <section className="surface-card character-card">
          <h1 className="page-title">
            Meu personagem
          </h1>
          <p className="description">
            Aqui estão todos os dados do seu personagem
          </p>

          {filteredCharacterGroups.length > 0
            ? filteredCharacterGroups.map((group) => (
              <CharacterInfoSection
                columns={group.columns ?? [group.attributes ?? []]}
                key={group.groupName}
                title={group.groupName}
              />
            ))
            : <p className="description">Os dados do personagem não foram encontrados. Volte à página inicial e tente novamente.</p>}
        </section>
      </main>
    </>
  );
}

export default CharacterPage;
